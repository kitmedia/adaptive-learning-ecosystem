#!/bin/bash

# Monitoring Setup Script
# Adaptive Learning Ecosystem - EbroValley Digital
# Set up monitoring infrastructure and health checks

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
MONITORING_CONFIG="$PROJECT_ROOT/monitoring.config.json"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[✅ SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[⚠️  WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[❌ ERROR]${NC} $1"
}

# Create monitoring directories
setup_directories() {
    log "Setting up monitoring directories..."
    
    mkdir -p "$LOG_DIR"/{application,system,performance,security,business}
    mkdir -p "$PROJECT_ROOT/monitoring"/{dashboards,alerts,reports}
    
    success "Monitoring directories created"
}

# Generate monitoring configuration
generate_monitoring_config() {
    log "Generating monitoring configuration..."
    
    cat > "$MONITORING_CONFIG" << EOF
{
  "monitoring": {
    "enabled": true,
    "environment": "${NODE_ENV:-development}",
    "version": "1.0.0",
    "config": {
      "realTimeUpdates": true,
      "alerting": true,
      "dataRetention": 30,
      "metricsInterval": 5000,
      "healthCheckInterval": 30000
    },
    "thresholds": {
      "pageLoadTime": 3000,
      "renderTime": 1000,
      "apiResponseTime": 2000,
      "errorRate": 5,
      "memoryUsage": 512,
      "cacheHitRate": 80,
      "userSatisfactionScore": 7,
      "bounceRate": 40,
      "conversionRate": 2
    },
    "endpoints": {
      "metrics": "/api/monitoring/metrics",
      "alerts": "/api/monitoring/alerts",
      "logs": "/api/monitoring/logs",
      "health": "/api/health",
      "status": "/api/status"
    },
    "logging": {
      "enabled": true,
      "level": "${LOG_LEVEL:-info}",
      "transports": {
        "console": true,
        "file": true,
        "remote": true,
        "localStorage": true
      },
      "buffer": {
        "size": 100,
        "flushInterval": 30000
      },
      "retention": {
        "days": 7,
        "maxFiles": 10
      }
    },
    "alerts": {
      "channels": ["console", "email", "webhook"],
      "severityLevels": ["info", "warning", "error", "critical"],
      "cooldown": 300000,
      "escalation": {
        "enabled": true,
        "thresholds": {
          "warning": 5,
          "critical": 10
        }
      }
    },
    "integrations": {
      "googleAnalytics": {
        "enabled": true,
        "trackingId": "${GA_TRACKING_ID:-}"
      },
      "sentry": {
        "enabled": false,
        "dsn": "${SENTRY_DSN:-}"
      },
      "elasticsearch": {
        "enabled": false,
        "endpoint": "${ELASTICSEARCH_URL:-}"
      },
      "prometheus": {
        "enabled": false,
        "endpoint": "${PROMETHEUS_URL:-}"
      }
    }
  }
}
EOF
    
    success "Monitoring configuration generated"
}

# Set up log rotation
setup_log_rotation() {
    log "Setting up log rotation..."
    
    cat > "$PROJECT_ROOT/logrotate.conf" << EOF
# Log rotation configuration for Adaptive Learning Ecosystem

$LOG_DIR/application/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        # Reload application if needed
        # systemctl reload adaptive-learning || true
    endscript
}

$LOG_DIR/system/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}

$LOG_DIR/performance/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}

$LOG_DIR/security/*.log {
    daily
    missingok
    rotate 90
    compress
    delaycompress
    notifempty
    create 600 www-data www-data
}

$LOG_DIR/business/*.log {
    weekly
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
EOF
    
    success "Log rotation configured"
}

# Create health check script
create_health_check() {
    log "Creating health check script..."
    
    cat > "$PROJECT_ROOT/scripts/health-check.sh" << 'EOF'
#!/bin/bash

# Health Check Script
# Adaptive Learning Ecosystem - EbroValley Digital

set -euo pipefail

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
HEALTH_ENDPOINT="/api/health"
TIMEOUT=10
LOG_FILE="/tmp/health-check.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Health check function
check_health() {
    local component="$1"
    local url="$2"
    local timeout="${3:-$TIMEOUT}"
    
    echo "Checking $component..." | tee -a "$LOG_FILE"
    
    if curl -s -f --max-time "$timeout" "$url" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $component: HEALTHY${NC}" | tee -a "$LOG_FILE"
        return 0
    else
        echo -e "${RED}❌ $component: UNHEALTHY${NC}" | tee -a "$LOG_FILE"
        return 1
    fi
}

# Main health check
main() {
    local failed=0
    
    echo "=== Health Check - $(date) ===" | tee -a "$LOG_FILE"
    
    # Check frontend
    if ! check_health "Frontend" "$API_BASE_URL"; then
        ((failed++))
    fi
    
    # Check API health endpoint
    if ! check_health "API Health" "$API_BASE_URL$HEALTH_ENDPOINT"; then
        ((failed++))
    fi
    
    # Check database connectivity (if available)
    if ! check_health "Database" "$API_BASE_URL/api/health/db"; then
        ((failed++))
    fi
    
    # Check external services
    if ! check_health "External APIs" "$API_BASE_URL/api/health/external"; then
        ((failed++))
    fi
    
    echo "=== Health Check Complete ===" | tee -a "$LOG_FILE"
    
    if [[ $failed -eq 0 ]]; then
        echo -e "${GREEN}🎉 All systems healthy${NC}" | tee -a "$LOG_FILE"
        exit 0
    else
        echo -e "${RED}🚨 $failed components unhealthy${NC}" | tee -a "$LOG_FILE"
        exit 1
    fi
}

main "$@"
EOF
    
    chmod +x "$PROJECT_ROOT/scripts/health-check.sh"
    success "Health check script created"
}

# Create monitoring dashboard setup
create_dashboard_config() {
    log "Creating monitoring dashboard configuration..."
    
    mkdir -p "$PROJECT_ROOT/monitoring/dashboards"
    
    cat > "$PROJECT_ROOT/monitoring/dashboards/system-overview.json" << EOF
{
  "dashboard": {
    "id": "system-overview",
    "title": "Sistema - Vista General",
    "description": "Dashboard principal de monitoreo del sistema",
    "refresh": "5s",
    "panels": [
      {
        "id": "system-health",
        "title": "Estado del Sistema",
        "type": "stat",
        "metrics": ["system.health", "system.uptime"],
        "thresholds": [
          {"value": 0, "color": "red"},
          {"value": 0.8, "color": "yellow"},
          {"value": 0.95, "color": "green"}
        ]
      },
      {
        "id": "performance-metrics",
        "title": "Métricas de Rendimiento",
        "type": "timeseries",
        "metrics": [
          "performance.pageLoadTime",
          "performance.renderTime",
          "performance.apiResponseTime"
        ],
        "unit": "ms"
      },
      {
        "id": "user-metrics",
        "title": "Métricas de Usuario",
        "type": "timeseries",
        "metrics": [
          "user.satisfaction",
          "user.engagement",
          "user.bounceRate"
        ]
      },
      {
        "id": "error-rate",
        "title": "Tasa de Errores",
        "type": "gauge",
        "metrics": ["system.errorRate"],
        "max": 10,
        "thresholds": [
          {"value": 0, "color": "green"},
          {"value": 2, "color": "yellow"},
          {"value": 5, "color": "red"}
        ]
      },
      {
        "id": "alerts",
        "title": "Alertas Activas",
        "type": "table",
        "metrics": ["alerts.active"],
        "columns": ["timestamp", "severity", "message", "component"]
      }
    ]
  }
}
EOF
    
    success "Dashboard configuration created"
}

# Set up alerting rules
setup_alerting() {
    log "Setting up alerting rules..."
    
    mkdir -p "$PROJECT_ROOT/monitoring/alerts"
    
    cat > "$PROJECT_ROOT/monitoring/alerts/rules.json" << EOF
{
  "alerting": {
    "rules": [
      {
        "name": "high_error_rate",
        "condition": "error_rate > 5",
        "severity": "critical",
        "message": "Tasa de errores muy alta: {{value}}%",
        "channels": ["email", "webhook"],
        "cooldown": 300
      },
      {
        "name": "slow_page_load",
        "condition": "page_load_time > 3000",
        "severity": "warning",
        "message": "Tiempo de carga lento: {{value}}ms",
        "channels": ["console"],
        "cooldown": 180
      },
      {
        "name": "low_user_satisfaction",
        "condition": "user_satisfaction < 7",
        "severity": "warning",
        "message": "Satisfacción del usuario baja: {{value}}/10",
        "channels": ["email"],
        "cooldown": 600
      },
      {
        "name": "high_memory_usage",
        "condition": "memory_usage > 512",
        "severity": "error",
        "message": "Uso de memoria alto: {{value}}MB",
        "channels": ["webhook"],
        "cooldown": 120
      },
      {
        "name": "low_cache_hit_rate",
        "condition": "cache_hit_rate < 80",
        "severity": "info",
        "message": "Tasa de cache baja: {{value}}%",
        "channels": ["console"],
        "cooldown": 300
      }
    ],
    "channels": {
      "email": {
        "enabled": true,
        "to": ["admin@ebrovalley.digital"],
        "subject": "[ALERT] {{rule_name}} - {{severity}}"
      },
      "webhook": {
        "enabled": true,
        "url": "${WEBHOOK_URL:-https://hooks.slack.com/your-webhook}",
        "method": "POST"
      },
      "console": {
        "enabled": true,
        "format": "json"
      }
    }
  }
}
EOF
    
    success "Alerting rules configured"
}

# Create monitoring startup script
create_startup_script() {
    log "Creating monitoring startup script..."
    
    cat > "$PROJECT_ROOT/scripts/start-monitoring.sh" << 'EOF'
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
EOF
    
    chmod +x "$PROJECT_ROOT/scripts/start-monitoring.sh"
    success "Monitoring startup script created"
}

# Main setup function
main() {
    echo "🔍 Setting up Monitoring Infrastructure - Adaptive Learning Ecosystem"
    echo "=================================================================="
    
    setup_directories
    generate_monitoring_config
    setup_log_rotation
    create_health_check
    create_dashboard_config
    setup_alerting
    create_startup_script
    
    echo
    echo "=================================================================="
    echo "🎉 Monitoring Setup Complete!"
    echo "=================================================================="
    echo
    echo "Next steps:"
    echo "1. Configure environment variables in .env files"
    echo "2. Run: ./scripts/start-monitoring.sh"
    echo "3. Access monitoring dashboard in development mode"
    echo "4. Set up external monitoring services (optional)"
    echo
    echo "Configuration files created:"
    echo "- $MONITORING_CONFIG"
    echo "- $PROJECT_ROOT/logrotate.conf"
    echo "- $PROJECT_ROOT/scripts/health-check.sh"
    echo "- $PROJECT_ROOT/scripts/start-monitoring.sh"
    echo "- $PROJECT_ROOT/monitoring/dashboards/"
    echo "- $PROJECT_ROOT/monitoring/alerts/"
    echo
}

# Run if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi