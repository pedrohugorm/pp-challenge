# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 8080

# Start the application in production mode
CMD ["npm", "run", "start"] 