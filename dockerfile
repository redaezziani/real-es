# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Setup the production environment
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy only the production build and node_modules from the builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./

# Install Prisma CLI for running migrations
RUN npm install -g prisma

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main.js"]
