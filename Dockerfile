# ARKAIOS Dynamic Scenario Studio - Production Dockerfile
# Builds Node.js frontend/backend + Python 3 + FFmpeg with libass & zoompan support

FROM node:20-bookworm-slim

# Install FFmpeg, Python3, and fonts for subtitle rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python3-pip \
    fonts-dejavu-core \
    fonts-freefont-ttf \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy application source
COPY . .

# Build Vite frontend and bundle server.ts
RUN npm run build

# Default environment
ENV NODE_ENV=production
ENV PORT=3000
ENV PYTHON_PATH=python3

EXPOSE 3000

# Start server
CMD ["node", "dist/server.cjs"]
