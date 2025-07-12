# Multi-stage Dockerfile for Production
# Adaptive Learning Ecosystem - EbroValley Digital
# Professional React + Vite + Nginx container

# ===== BASE IMAGE =====
FROM node:20-alpine AS base
LABEL maintainer="EbroValley Digital <toño@ebrovalley.digital>"
LABEL description="Adaptive Learning Ecosystem Frontend"
LABEL version="2.0.0"

# Install security updates and essential packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates && \
    rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# ===== DEPENDENCIES STAGE =====
FROM base AS deps

# Copy package files
COPY package*.json ./
COPY .npmrc* ./

# Install dependencies with security audit
RUN npm audit --audit-level=moderate || true && \
    npm ci --only=production --no-optional && \
    npm cache clean --force

# ===== BUILD STAGE =====
FROM base AS builder

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm ci --include=dev

# Copy source code
COPY . .

# Set build environment variables
ENV NODE_ENV=production
ENV VITE_BUILD_MODE=production
ENV GENERATE_SOURCEMAP=false

# Build application with optimizations
RUN npm run build && \
    npm run build:analyze || true

# Verify build output
RUN ls -la dist/ && \
    test -f dist/index.html || (echo "Build failed: index.html not found" && exit 1)

# ===== NGINX PRODUCTION STAGE =====
FROM nginx:1.25-alpine AS production

# Install security updates and health check tools
RUN apk update && apk upgrade && \
    apk add --no-cache \
    curl \
    tini \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nginxapp && \
    adduser -S nginxapp -u 1001 -G nginxapp

# Copy optimized nginx configuration
COPY nginx.prod.conf /etc/nginx/nginx.conf
COPY nginx-default.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder --chown=nginxapp:nginxapp /app/dist /usr/share/nginx/html

# Copy security headers file for Netlify compatibility
COPY --from=builder --chown=nginxapp:nginxapp /app/public/_headers /usr/share/nginx/html/_headers

# Set up proper permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginxapp:nginxapp /var/cache/nginx && \
    chown -R nginxapp:nginxapp /var/log/nginx && \
    chown -R nginxapp:nginxapp /var/run && \
    chown -R nginxapp:nginxapp /usr/share/nginx/html && \
    chown -R nginxapp:nginxapp /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown nginxapp:nginxapp /var/run/nginx.pid

# Create health check script
RUN echo '#!/bin/sh\ncurl -f http://localhost:8080/health || exit 1' > /usr/local/bin/healthcheck.sh && \
    chmod +x /usr/local/bin/healthcheck.sh && \
    chown nginxapp:nginxapp /usr/local/bin/healthcheck.sh

# Switch to non-root user
USER nginxapp

# Expose port
EXPOSE 8080

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh

# Add metadata
LABEL org.opencontainers.image.title="Adaptive Learning Ecosystem Frontend"
LABEL org.opencontainers.image.description="Production-ready React frontend with Nginx"
LABEL org.opencontainers.image.vendor="EbroValley Digital"
LABEL org.opencontainers.image.version="2.0.0"
LABEL org.opencontainers.image.created="2025-07-10"

# Use tini as entrypoint for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]