#!/bin/bash

# Start Monitoring Services
# Adaptive Learning Ecosystem - EbroValley Digital

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔍 Starting Monitoring Services..."

# Start health check daemon
if command -v systemctl >/dev/null 2>&1; then
    echo "Setting up health check service..."
    # Create systemd service for health checks
    sudo tee /etc/systemd/system/adaptive-learning-health.service > /dev/null << EOL
[Unit]
Description=Adaptive Learning Health Check
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$PROJECT_ROOT
ExecStart=$PROJECT_ROOT/scripts/health-check.sh
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
EOL
    
    sudo systemctl daemon-reload
    sudo systemctl enable adaptive-learning-health
    sudo systemctl start adaptive-learning-health
else
    echo "Running health check in background..."
    nohup "$PROJECT_ROOT/scripts/health-check.sh" &
fi

# Start log monitoring (if available)
if command -v logrotate >/dev/null 2>&1; then
    echo "Setting up log rotation..."
    sudo cp "$PROJECT_ROOT/logrotate.conf" /etc/logrotate.d/adaptive-learning
fi

echo "✅ Monitoring services started"
