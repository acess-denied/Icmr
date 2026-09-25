# Multi-stage production build for ICMR STS 2026 Platform
FROM node:20-bookworm-slim AS base

# Install Python 3 and pip for PDF clinical report generator
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY pdf-service/requirements.txt ./pdf-service/

# Install Node and Python dependencies
RUN npm install
RUN pip3 install --no-cache-dir --break-system-packages -r pdf-service/requirements.txt || true

# Copy source code and build React frontend
COPY . .
RUN npm run build

# Expose container ingress port
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start production server
CMD ["node", "server.js"]
