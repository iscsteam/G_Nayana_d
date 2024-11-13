// "use client";
// import React, { useState, useEffect, ChangeEvent } from 'react';
// import Head from 'next/head';
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
// import { FileUpload } from "@/components/ui/file-upload";
// import Image from 'next/image';
// import { ArrowRight, Eye, AlertTriangle } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Info } from 'lucide-react';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// interface EyeResult {
//   predicted_class: number;
//   Stage: string;
//   confidence: string;
//   explanation: string;
//   Note: string | null;
//   Risk_Factor: string;
// }

// interface ApiResponse {
//   left_image_result: EyeResult;
//   right_image_result: EyeResult;
// }

// interface ChartDataItem {
//   name: string;
//   value: number;
//   displayValue: string;
//   markers?: { position: number; label: string }[];
//   isConfidence?: boolean;
//   isPredictionClass?: boolean;
// }

// const getTooltipContent = (itemName: string): string => {
//   switch (itemName) {
//     case 'Prediction Class':
//       return 'The model evaluates and indicates the Stage of diabetic retinopathy it has identified in your case.';
//     case 'Confidence':
//       return 'This shows how sure the model is about its prediction, with a higher number meaning more certainty.';
//     case 'Risk_Factor':
//       return 'This indicates the chance that your condition might get worse over time.';
//     default:
//       return '';
//   }
// };

// const getColorForValue = (value: number, isConfidence: boolean, isPredictionClass: boolean): string => {
//   if (isPredictionClass) {
//     if (value <= 0) return 'hsl(var(--chart-1))'; // Green for No DR
//     if (value <= 1) return 'hsl(var(--chart-4))'; // Yellow for Moderate
//     return 'hsl(var(--chart-2))'; // Red for Severe
//   } else if (isConfidence) {
//     if (value <= 33) return 'hsl(var(--chart-2))'; // Red for Low
//     if (value <= 66) return 'hsl(var(--chart-4))'; // Yellow for Medium
//     return 'hsl(var(--chart-1))'; // Green for High
//   } else {
//     // For Risk_Factor
//     if (value <= 33) return 'hsl(var(--chart-1))'; // Green for Low
//     if (value <= 66) return 'hsl(var(--chart-4))'; // Yellow for Medium
//     return 'hsl(var(--chart-2))'; // Red for High
//   }
// };
// const CustomBarChart = ({ data }: { data: ChartDataItem[] }) => {
//   return (
//     <div className="space-y-6">
//       {data.map((item) => (
//         <motion.div 
//           key={item.name} 
//           className="relative"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//         >
//           <div className="flex justify-between mb-2">
//           <span className="text-sm font-medium text-gray-700 flex items-center">
//               {item.name}
//               <TooltipProvider>
//                 <Tooltip>
//                   <TooltipTrigger asChild>
//                     <Info className="ml-1 h-4 w-4 text-gray-400 " />
//                   </TooltipTrigger>
//                   <TooltipContent className="bg-white text-black rounded-lg border border-gray-200 shadow-lg p-2">
//                     <p>{getTooltipContent(item.name)}</p>
//                   </TooltipContent>
//                 </Tooltip>
//               </TooltipProvider>
//             </span>
//             <span className="text-sm font-bold text-gray-900">{item.displayValue}</span>
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-5 dark:bg-gray-700">
//             <motion.div
//               className="h-5 rounded-full transition-all duration-500 ease-in-out"
//               style={{
//                 width: `${item.isPredictionClass ? ((item.value + 1) / 3) * 100 : item.value}%`,
//                 backgroundColor: getColorForValue(item.value, item.isConfidence || false, item.isPredictionClass || false),
//               }}
//               initial={{ width: 0 }}
//               animate={{ width: `${item.isPredictionClass ? ((item.value + 1) / 3) * 100 : item.value}%` }}
//               transition={{ duration: 0.5, delay: 0.2 }}
//             />
//           </div>
//           {item.markers && (
//             <div className="flex justify-between mt-2 text-xs text-gray-500">
//               {item.markers.map((marker, idx) => (
//                 <div key={idx} className="text-center" style={{ width: '33.33%' }}>
//                   {marker.label}
//                 </div>
//               ))}
//             </div>
//           )}
//         </motion.div>
//       ))}
//     </div>
//   );
// };

// const EyeAnalysisCard = ({ eye, data }: { eye: string; data: EyeResult }) => {
//   const { Stage, confidence, explanation, Risk_Factor, predicted_class } = data;
//   const chartData: ChartDataItem[] = [
//     {
//       name: 'Prediction Class',
//       value: predicted_class,
//       displayValue: Stage,
//       markers: [
//         { position: 33, label: 'No DR' },
//         { position: 66, label: 'Moderate' },
//         { position: 100, label: 'Severe' },
//       ],
//       isPredictionClass: true
//     },
//     {
//       name: 'Confidence',
//       value: parseFloat(confidence.replace('%', '')),
//       displayValue: confidence,
//       markers: [
//         { position: 33, label: 'Low' },
//         { position: 66, label: 'Medium' },
//         { position: 100, label: 'High' },
//       ],
//       isConfidence: true
//     },
    
//     {
//       name: 'Risk_Factor',
//       value: parseFloat(Risk_Factor.replace('%', '')),
//       displayValue: Risk_Factor,
//       markers: [
//         { position: 33, label: 'Low' },
//         { position: 66, label: 'Medium' },
//         { position: 100, label: 'High' },
//       ]
//     },
//   ];

//   return (
//     <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300">
//       <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
//         <CardTitle className="text-2xl font-bold mb-2 flex items-center">
//           <Eye className="mr-2" /> {eye} Eye Analysis
//         </CardTitle>
//         <Separator className="my-3 bg-white/20" />
//         <CardDescription className="text-lg mt-3 font-medium text-white/90">{Stage}: {explanation}</CardDescription>
//       </CardHeader>
//       <CardContent className="pt-6">
//         <CustomBarChart data={chartData} />
//       </CardContent>
//       <CardFooter className="flex flex-col items-start border-t p-4 bg-gray-50">
//         <div className="text-sm font-medium mb-1 text-gray-700">Note:</div>
//         <div className="text-sm text-muted-foreground">{data.Note}</div>
//       </CardFooter>
//     </Card>
//   );
// };


// const START_GRADIENT_POSITION = -130;
// const END_GRADIENT_POSITION = 210;
// const MAX_GRADIENT_Y = 216 - 80;
// const GRADIENT_MOVE_INTERVAL = 10;
// const GLOWING_LINE_HEIGHT = 81;
// const GLOW_COLOR = "#ace5f4";

// type SVGLineGlowAnimateProps = {
//   movementDelay?: number;
//   id: number;
//   additionalHeight?: number;
//   initialGradientY?: number;
// };

// const SVGLineGlowAnimate: React.FC<SVGLineGlowAnimateProps> = ({
//   movementDelay = 0,
//   id,
//   additionalHeight = 0,
//   initialGradientY = 0,
// }) => {
//   const svgHeight = 228 + additionalHeight;
//   const [gradientPosition, setGradientPosition] = useState({
//     y1: START_GRADIENT_POSITION,
//     y2: END_GRADIENT_POSITION,
//   });
//   const [opacity, setOpacity] = useState(0);

//   React.useEffect(() => {
//     const totalDistance = svgHeight - GLOWING_LINE_HEIGHT;
//     const halfDistance = totalDistance / 2;

//     const moveGradient = () => {
//       setGradientPosition((prev) => {
//         const newY1 = prev.y1 + 1;
//         const newY2 = prev.y2 + 1;

//         const distanceTravelled = newY1 - START_GRADIENT_POSITION;
//         let newOpacity = 0;

//         if (distanceTravelled <= halfDistance) {
//           newOpacity = distanceTravelled / halfDistance;
//         } else {
//           newOpacity = 1 - (distanceTravelled - halfDistance) / halfDistance;
//         }

//         setOpacity(newOpacity);

//         if (newY1 > MAX_GRADIENT_Y - GLOWING_LINE_HEIGHT) {
//           return {
//             y1: START_GRADIENT_POSITION,
//             y2: END_GRADIENT_POSITION,
//           };
//         }
//         return {
//           y1: newY1,
//           y2: newY2,
//         };
//       });
//     };

//     const startTimeout = setTimeout(() => {
//       const interval = setInterval(moveGradient, GRADIENT_MOVE_INTERVAL);
//       return () => clearInterval(interval);
//     }, movementDelay);

//     return () => {
//       clearTimeout(startTimeout);
//       setOpacity(0);
//     };
//   }, [movementDelay, svgHeight]);

//   return (
//     <svg
//       width="12"
//       height={svgHeight}
//       viewBox={`0 0 12 ${svgHeight}`}
//       fill="none"
//       xmlns="http://www.w3.org/2000/svg"
//     >
//       <path id={`main-line-${id}`} d={`M6 ${svgHeight} L6 0`}></path>

//       <use
//         href={`#main-line-${id}`}
//         opacity={opacity}
//         stroke={`url(#gradient-glow-${id})`}
//         strokeWidth="6"
//         style={{
//           filter: `blur(2px) drop-shadow(0px 0px 2px ${GLOW_COLOR})`,
//           transition: `opacity ${GRADIENT_MOVE_INTERVAL}ms linear`,
//         }}
//       />

//       <use
//         href={`#main-line-${id}`}
//         stroke={`url(#gradient-solid-${id})`}
//         strokeWidth="2"
//       />

//       <defs>
//         <linearGradient
//           id={`gradient-glow-${id}`}
//           x1="6"
//           y1={gradientPosition.y1}
//           x2="6"
//           y2={gradientPosition.y2}
//           gradientUnits="userSpaceOnUse"
//         >
//           <stop offset="0.38" stopColor={GLOW_COLOR} stopOpacity="0"></stop>
//           <stop offset="0.5" stopColor={GLOW_COLOR} stopOpacity="0.8"></stop>
//           <stop offset="0.62" stopColor={GLOW_COLOR} stopOpacity="0"></stop>
//         </linearGradient>

//         <linearGradient
//           id={`gradient-solid-${id}`}
//           x1="6"
//           y1={initialGradientY}
//           x2="6"
//           y2={svgHeight}
//           gradientUnits="userSpaceOnUse"
//         >
//           <stop stopColor={GLOW_COLOR} stopOpacity="0"></stop>
//           <stop offset="0.5" stopColor={GLOW_COLOR}></stop>
//           <stop offset="1" stopColor={GLOW_COLOR} stopOpacity="0"></stop>
//         </linearGradient>
//       </defs>
//     </svg>
//   );
// };

// const GlowingLineGrid = () => {
//   return (
//     <div className="absolute inset-0 z-20 pointer-events-none">
//       <div className="w-full h-full grid grid-cols-64 grid-rows-8">
//         {[...Array(512)].map((_, index) => (
//           <div key={index} className="flex items-center justify-center">
//             <SVGLineGlowAnimate 
//               movementDelay={index * 200} 
//               id={index} 
//               additionalHeight={
//                 index % 64 === 1 || index % 64 === 2 || index % 64 === 5 || index % 64 === 6 ? 20 : 0
//               } 
//               initialGradientY={
//                 index % 64 === 0 || index % 64 === 3 || index % 64 === 4 || index % 64 === 7 ? 20 : 0
//               }
//             />
//           </div>
//         ))}

//         {/* Center horizontal line */}
      
//         </div>
//     </div>
//   );
// };


// const DistortedGlass = () => {
//   const [isVisible, setIsVisible] = useState(true);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setIsVisible((prev) => !prev);
//     }, isVisible ? 5000 : 3);

//     return () => clearInterval(interval);
//   }, [isVisible]);

//   return (
//     <AnimatePresence>
//       {isVisible && (
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           transition={{ duration: 0.3 }}
//           className="absolute inset-0 z-10 overflow-hidden"
//         >
//           <div className="glass-effect h-full w-full" />
//           <GlowingLineGrid />
//         </motion.div>
//       )}
//       <svg className="hidden">
//         <defs>
//           <filter id="fractal-noise-glass">
//             <feTurbulence
//               type="fractalNoise"
//               baseFrequency="0.12 0.12"
//               numOctaves="1"
//               result="warp"
//             />
//             <feDisplacementMap
//               xChannelSelector="R"
//               yChannelSelector="G"
//               scale="30"
//               in="SourceGraphic"
//               in2="warp"
//             />
//           </filter>
//         </defs>
//       </svg>
//       <style jsx>{`
//         .glass-effect {
//           background: rgba(0, 0, 0, 0.2);
//           background: repeating-radial-gradient(
//             circle at 50% 50%,
//             rgb(255 255 255 / 0),
//             rgba(255, 255, 255, 0.2) 10px,
//             rgb(255 255 255) 31px
//           );
//           filter: url(#fractal-noise-glass);
//           background-size: 6px 6px;
//           backdrop-filter: blur(3px);
//         }
//       `}</style>
//     </AnimatePresence>
//   );
// };

// const MovingImage = ({ src, alt, isMoving }: { src: string; alt: string; isMoving: boolean }) => {
//   return (
//     <motion.div
//       className="relative w-[150px] h-[150px] overflow-hidden"
//       animate={isMoving ? { x: [0, 10, -10, 0] } : { x: 0 }}
//       transition={{ 
//         repeat: isMoving ? Infinity : 0, 
//         duration: 4, 
//         ease: "easeInOut" 
//       }}
//     >
//       <Image
//         src={src}
//         alt={alt}
//         layout="fill"
//         objectFit="cover"
//         className="absolute top-0 left-0"
//       />
//     </motion.div>
//   );
// };



// export function Analysis() {
//   const [patientId, setPatientId] = useState<string>('');
//   const [leftEyeImage, setLeftEyeImage] = useState<File | null>(null);
//   const [rightEyeImage, setRightEyeImage] = useState<File | null>(null);
//   const [leftEyePreview, setLeftEyePreview] = useState<string | null>(null);
//   const [rightEyePreview, setRightEyePreview] = useState<string | null>(null);
//   const [apiData, setApiData] = useState<ApiResponse | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [showInputCard, setShowInputCard] = useState<boolean>(true);
//   const [isMoving, setIsMoving] = useState<boolean>(false);

//   const handlePatientIdChange = (e: ChangeEvent<HTMLInputElement>) => {
//     setPatientId(e.target.value);
//   };

//   const handleImageUpload = (file: File | null, eye: 'left' | 'right') => {
//     if (file) {
//       if (eye === 'left') {
//         setLeftEyeImage(file);
//         setLeftEyePreview(URL.createObjectURL(file));
//       } else {
//         setRightEyeImage(file);
//         setRightEyePreview(URL.createObjectURL(file));
//       }
//     }
//   };

//   const handleSubmit = async () => {
//     if (!patientId || !leftEyeImage || !rightEyeImage) {
//       setError('Please fill in all fields and upload both eye images.');
//       return;
//     }
  
//     setIsLoading(true);
//     setError(null);
//     setIsMoving(true);
  
//     const formData = new FormData();
//     formData.append('left_image', leftEyeImage);
//     formData.append('right_image', rightEyeImage);
  
//     try {
//       const response = await fetch(`https://backend-drd.azurewebsites.net/infer/?patient_id=${encodeURIComponent(patientId)}`, {
//         method: 'POST',
//         body: formData,
//       });
//       if (!response.ok) {
//         throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
//       }
  
//       const data: ApiResponse = await response.json();
//       setApiData(data);
//       setShowInputCard(false);
//     } catch (error) {
//       if (error instanceof Error) {
//         setError(`An error occurred while processing your request: ${error.message}`);
//       } else {
//         setError('An unknown error occurred');
//       }
//       console.error('Error:', error);
//     } finally {
//       setIsLoading(false);
//       setIsMoving(false);
//     }
//   };

//   return (
//     <>
//       <Head>
//         <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
//       </Head>
//       <div className="min-h-screen w-full dark:bg-black bg-white dark:bg-grid-small-white/[0.2] bg-grid-small-black/[0.2] relative flex items-center justify-center">
//       <div className="flex-1 p-6">
//       <div className="max-w-6xl mx-auto">
//         {showInputCard ? (
//         <Card className="mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
//                 <CardHeader className="bg-gradient">
//                   <CardTitle className="text-xl font-semibold">Diabetic Retinopathy Report Generator</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-6 p-6">
//                   <Input
//                     type="text"
//                     placeholder="Patient ID"
//                     value={patientId}
//                     onChange={handlePatientIdChange}
//                     className="w-full border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
//                   />

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div className="space-y-2">
//                       <p className="text-sm font-bold text-gray-700">Left Eye Image</p>
//                       <FileUpload onChange={(file) => handleImageUpload(file, 'left')} />
//                       {leftEyePreview && (
//                         <div className="mt-2 flex items-center justify-center relative overflow-hidden">
//                           <MovingImage src={leftEyePreview} alt="Left Eye Preview" isMoving={isMoving} />
//                           {isLoading && <DistortedGlass />}
//                         </div>
//                       )}
//                     </div>
//                     <div className="space-y-2">
//                       <p className="text-sm font-bold text-gray-700">Right Eye Image</p>
//                       <FileUpload onChange={(file) => handleImageUpload(file, 'right')} />
//                       {rightEyePreview && (
//                         <div className="mt-2 flex items-center justify-center relative overflow-hidden">
//                           <MovingImage src={rightEyePreview} alt="Right Eye Preview" isMoving={isMoving} />
//                           {isLoading && <DistortedGlass />}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </CardContent>
//                 <CardFooter className="bg-gray-50 p-4 flex flex-col items-center">
//                   <Button 
//                     onClick={handleSubmit} 
//                     disabled={isLoading}
//                     className="hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center"
//                   >
//                     {isLoading ? 'Analyzing...' : 'Submit Analysis'}
//                     {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
//                   </Button>
//                   {error && (
//                     <motion.div 
//                       className="text-red-500 mt-2 flex items-center"
//                       initial={{ opacity: 0, y: -10 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       transition={{ duration: 0.3 }}
//                     >
//                       <AlertTriangle className="mr-2" /> {error}
//                     </motion.div>
//                   )}
//                 </CardFooter>
               
//         </Card>
//         ) : null}
//     {apiData && (
//               <motion.div 
//                 className="grid grid-cols-1 md:grid-cols-2 gap-6"
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.5 }}
//               >
//                 <EyeAnalysisCard eye="Left" data={apiData.left_image_result} />
//                 <EyeAnalysisCard eye="Right" data={apiData.right_image_result} />
//               </motion.div>
//             )}
//           </div>
        
//        </div>
//     </div>
    
//     </>
//   );
// }