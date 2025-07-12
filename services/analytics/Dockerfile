# Dockerfile for Analytics Service
# Adaptive Learning Ecosystem - EbroValley Digital

FROM python:3.11-slim

LABEL maintainer="EbroValley Digital <dev@ebrovalley.com>"
LABEL description="Adaptive Learning Ecosystem - Analytics Service"

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=random \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create app directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' analytics

# Set ownership
RUN chown -R analytics:analytics /app

# Switch to non-root user
USER analytics

# Expose port
EXPOSE 8004

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8004/health || exit 1

# Start the application
CMD ["python", "main.py"]