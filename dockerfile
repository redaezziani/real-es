# Use a smaller base image
FROM node:22-alpine AS builder

WORKDIR /app

# Copy only the necessary package files first for cache optimization
COPY package*.json ./

# Install dependencies (using npm ci for deterministic installs)
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Generate Prisma client (this could be done as part of build step)
RUN npx prisma generate

# Build the application
RUN npm run build

# --------------------------------------------
# Production image

FROM node:22-alpine

WORKDIR /app

# Copy only necessary artifacts from the builder stage to keep image lean
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Expose port for the app
EXPOSE 8000

# Use a non-root user (for security reasons)
USER node

# Start the application
CMD ["npm", "run", "start:prod"]
