# Step 1: Build the Next.js app
FROM node:18 AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project directory to the working directory
COPY . .

# Build the Next.js app
RUN npm run build

# Step 2: Create a lightweight production image
FROM node:18-alpine AS runner

# Set the environment variables for Clerk
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bXVzaWNhbC1tb2xlLTc0LmNsZXJrLmFjY291bnRzLmRldiQ
ENV CLERK_SECRET_KEY=sk_test_PXC2ldHojHw1wEzoweiybKq8Fid2frsI7VEDtYFgXg
ENV NODE_ENV=production

# Set the working directory inside the container
WORKDIR /app

# Copy the build output and node_modules from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Expose the port that the Next.js app runs on
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "run", "start"]
