# Progress Tracking Service Dockerfile
# Adaptive Learning Ecosystem - EbroValley Digital
# Production-ready FastAPI container

FROM python:3.11-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Create working directory
WORKDIR /app

# Create non-root user
RUN groupadd --gid 1001 fastapi && \
    useradd --uid 1001 --gid fastapi --shell /bin/bash --create-home fastapi

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set ownership
RUN chown -R fastapi:fastapi /app

# Switch to non-root user
USER fastapi

# Expose port
EXPOSE 5004

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5004/health || exit 1

# Start the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5004", "--workers", "2"]