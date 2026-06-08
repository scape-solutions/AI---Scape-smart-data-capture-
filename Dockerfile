# ==========================================
# STAGE 1: Build the React Application
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies needed for compiling TypeScript/Vite)
RUN npm ci

# Copy the rest of the application files
COPY . .

# Compile and build the React SPA production assets
RUN npm run build

# ==========================================
# STAGE 2: Spin up the Production Server
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy dependency manifests
COPY package*.json ./

# Install production-only dependencies
RUN npm ci --only=production

# Copy production assets and server code from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

# Expose port (Cloud Run overrides this via PORT env variable, defaulting to 8080)
EXPOSE 8080

# Run the Express server
CMD ["node", "server.js"]
