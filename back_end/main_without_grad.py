import os
import json
import io
import numpy as np
import torch
import torch.nn as nn
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from torchvision import transforms, models
from PIL import Image
import cv2
import requests
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware
import yaml  # Import YAML module

# Load configuration from the YAML file
with open("config.yaml", "r") as config_file:
    config = yaml.safe_load(config_file)

app = FastAPI()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=config['cors']['allow_origins'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Azure Blob Storage configuration
AZURE_STORAGE_CONNECTION_STRING = config['azure']['storage_connection_string']
CONTAINER_NAME = config['azure']['container_name']
blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)

# Constants
IMG_SIZE = 600
NUM_CLASSES = 4
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
BEST_MODEL_PATH = config['model']['best_model_path']

CATEGORY_MAPPING = {
    0: 'No Diabetic Retinopathy',
    1: 'Mild Diabetic Retinopathy',
    2: 'Moderate to Severe Diabetic Retinopathy',
    3: 'Proliferative Diabetic Retinopathy'
}

explanation_labels = {
    0: (
        'No DR: No diabetic retinopathy detected.\n'
        'The analysis indicates a low chance of developing diabetic retinopathy if blood sugar levels are well-managed.'
    ),
    1: ( 
        'Mild NPDR (Nonproliferative Diabetic Retinopathy):\n'
        'Microaneurysms have been detected, which are small, localized dilations of blood vessels in the retina. '
        'This finding suggests a moderate chance of progression if not monitored and managed properly.'
    ),
    2: (
        'Moderate to Severe NPDR:\n'
        'The analysis shows hemorrhages, including both dot-and-blot and flame-shaped types, and prominent exudates, indicating retinal edema. '
        'These findings suggest a high chance of further progression if left untreated, requiring close monitoring and intervention.'
    ),
    3: (
        'Proliferative Diabetic Retinopathy (PDR):\n'
        'Neovascularization has been observed, characterized by the growth of new, abnormal blood vessels on the retina. '
        'Additionally, cotton wool spots may be present, indicating localized retinal ischemia. '
        'These findings carry a significant risk of vision loss and complications, necessitating urgent medical intervention.'
    )
}

# Functions for Azure Blob Storage
def generate_sas_token(container_name, blob_name):
    sas_token = generate_blob_sas(
        account_name=blob_service_client.account_name,
        container_name=container_name,
        blob_name=blob_name,
        account_key=blob_service_client.credential.account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.utcnow() + timedelta(hours=1)
    )
    return sas_token

def upload_image_to_azure(patient_id, image_file, image_name):
    blob_client = blob_service_client.get_blob_client(container=CONTAINER_NAME, blob=f'{patient_id}/{image_name}')
    blob_client.upload_blob(image_file, overwrite=True)
    sas_token = generate_sas_token(CONTAINER_NAME, f'{patient_id}/{image_name}')
    image_url = f"{blob_client.url}?{sas_token}"
    return image_url

def save_results_to_azure(patient_id, results, filename='results.json'):
    blob_client = blob_service_client.get_blob_client(container=CONTAINER_NAME, blob=f'{patient_id}/{filename}')
    json_data = json.dumps(results, indent=4)
    blob_client.upload_blob(json_data, overwrite=True)

def process_image_from_url(image_url):
    try:
        response = requests.get(image_url)
        response.raise_for_status()
        image = Image.open(io.BytesIO(response.content)).convert("RGB")
        return image
    except Exception as e:
        raise Exception(f"Image processing error: {e}")

class EfficientNetB3Model(nn.Module):
    def __init__(self, num_classes):
        super(EfficientNetB3Model, self).__init__()
        self.efficientnet = models.efficientnet_b3(weights=None)
        num_ftrs = self.efficientnet.classifier[1].in_features
        self.efficientnet.classifier = nn.Sequential(
            nn.Linear(num_ftrs, 1024),
            nn.ReLU(),
            nn.BatchNorm1d(1024),
            nn.Dropout(0.2),
            nn.Linear(1024, 512),
            nn.ReLU(),
            nn.BatchNorm1d(512),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        return self.efficientnet(x)

def trim(im):
    percentage = 0.02
    img = np.array(im)
    img_gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    im_bin = img_gray > 0.1 * np.mean(img_gray[img_gray != 0])
    row_sums = np.sum(im_bin, axis=1)
    col_sums = np.sum(im_bin, axis=0)
    rows = np.where(row_sums > img.shape[1] * percentage)[0]
    cols = np.where(col_sums > img.shape[0] * percentage)[0]
    min_row, min_col = np.min(rows), np.min(cols)
    max_row, max_col = np.max(rows), np.max(cols)
    im_crop = img[min_row:max_row + 1, min_col:max_col + 1]
    return Image.fromarray(im_crop)

def resize_maintain_aspect(image, desired_size):
    old_size = image.size
    ratio = float(desired_size) / max(old_size)
    new_size = tuple([int(x * ratio) for x in old_size])
    im = image.resize(new_size, Image.LANCZOS)
    new_im = Image.new("RGB", (desired_size, desired_size))
    new_im.paste(im, ((desired_size - new_size[0]) // 2, (desired_size - new_size[1]) // 2))
    return new_im

def apply_clahe_color(image):
    lab = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    limg = cv2.merge((cl, a, b))
    final_image = cv2.cvtColor(limg, cv2.COLOR_LAB2RGB)
    return Image.fromarray(final_image)

def process_image(image):
    trimmed_image = trim(image)
    resized_image = resize_maintain_aspect(trimmed_image, IMG_SIZE)
    final_image = apply_clahe_color(resized_image)
    return final_image

def infer(model, image_url, transform):
    img = process_image_from_url(image_url)
    img_tensor = transform(img).unsqueeze(0).to(DEVICE)
    
    with torch.no_grad():
        outputs = model(img_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, 1)
    
    return predicted.item(), confidence.item()

def generate_result(predicted_class, confidence):
    explanation = explanation_labels.get(predicted_class, 'Unknown')
    confidence_percentage = round(confidence * 100, 2)
    stage = CATEGORY_MAPPING[predicted_class]

    if predicted_class == 3:  # Proliferative Diabetic Retinopathy
        Risk_Factor = round(confidence * 100, 2)
    else:
        Risk_Factor = round((1 - confidence) * 100, 2)

    result = {
        "predicted_class": int(predicted_class),
        "Stage": stage,
        "confidence": confidence_percentage,
        "explanation": explanation,
        "Note": None , 
        "Risk_Factor": Risk_Factor   
        # Placeholder for warning messages
    }

    # Add warnings based on the confidence and predicted class
    if confidence < 0.55 and predicted_class == 0:
        result["Note"] = f"You have a higher chance of progressing to the next stage with a risk factor of {Risk_Factor}%. Please consult your doctor for further advice."
    elif confidence >= 0.55 and confidence <= 0.74 and predicted_class == 0:
        result["Note"] = f"You have a minimum chance of progressing to the next stage with a risk factor of {Risk_Factor}%."
    elif confidence >= 0.75 and predicted_class == 0:
        result["Note"] = "Your eye is in the safe zone."
    elif predicted_class == 1:
        result["Note"] = f"Mild diabetic retinopathy detected. Risk factor is {Risk_Factor}%. Please consult your doctor for further advice."
    elif predicted_class == 2:
        result["Note"] = f"Moderate to severe diabetic retinopathy detected. Risk factor is {Risk_Factor}%. Please consult your doctor for further advice."
    elif predicted_class == 3:
        result["Note"] = "Proliferative diabetic retinopathy detected. Urgent medical intervention is necessary to prevent severe vision loss. Please consult your healthcare provider immediately."

    return result

# Load the model once at the start of the application
model = EfficientNetB3Model(NUM_CLASSES).to(DEVICE)
checkpoint = torch.load(BEST_MODEL_PATH, map_location=DEVICE)
model.load_state_dict(checkpoint['model_state_dict'])
model.eval()

@app.post("/infer/")
async def run_inference(patient_id: str, left_image: UploadFile = File(...), right_image: UploadFile = File(...)):
    # Define transform
    transform = transforms.Compose([transforms.ToTensor()])
    
    # Upload the images to Azure Blob Storage
    left_image_url = upload_image_to_azure(patient_id, await left_image.read(), 'left_image.jpg')
    right_image_url = upload_image_to_azure(patient_id, await right_image.read(), 'right_image.jpg')

    # Run inference using image URLs
    left_class, left_confidence = infer(model, left_image_url, transform)
    right_class, right_confidence = infer(model, right_image_url, transform)
    
    # Generate detailed results
    left_result = generate_result(left_class, left_confidence)
    right_result = generate_result(right_class, right_confidence)
    
    # Prepare final results
    results = {
        "left_eye": left_result,
        "right_eye": right_result
    }
    
    # Save results to Azure Blob Storage
    save_results_to_azure(patient_id, results)
    
    return JSONResponse(content=results)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
