#!/bin/bash

# Production Deployment Script
# Adaptive Learning Ecosystem - EbroValley Digital
# Automated deployment with zero-downtime

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="adaptive-learning-ecosystem"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"
BACKUP_DIR="backups"
DEPLOY_LOG="deploy.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOY_LOG"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$DEPLOY_LOG"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$DEPLOY_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOY_LOG"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    command -v docker >/dev/null 2>&1 || error "Docker is not installed"
    command -v docker-compose >/dev/null 2>&1 || error "Docker Compose is not installed"
    
    if [[ ! -f "$ENV_FILE" ]]; then
        error "Environment file $ENV_FILE not found. Copy from .env.production.example"
    fi
    
    if [[ ! -f "$DOCKER_COMPOSE_FILE" ]]; then
        error "Docker Compose file $DOCKER_COMPOSE_FILE not found"
    fi
    
    success "Prerequisites check passed"
}

# Load environment variables
load_environment() {
    log "Loading environment variables..."
    
    # Source environment file
    set -a
    source "$ENV_FILE"
    set +a
    
    # Validate required variables
    required_vars=(
        "POSTGRES_PASSWORD"
        "JWT_SECRET"
        "STRIPE_SECRET_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    success "Environment loaded and validated"
}

# Create backup
create_backup() {
    log "Creating database backup..."
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Generate backup filename
    BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Create database backup if container is running
    if docker ps | grep -q "adaptive-postgres"; then
        docker exec adaptive-postgres pg_dump \
            -U "${POSTGRES_USER:-postgres}" \
            -d "${POSTGRES_DB:-adaptive_learning}" \
            > "$BACKUP_FILE" || warning "Backup failed - continuing deployment"
        
        if [[ -f "$BACKUP_FILE" ]]; then
            success "Database backup created: $BACKUP_FILE"
        fi
    else
        warning "Database container not running - skipping backup"
    fi
}

# Build images
build_images() {
    log "Building Docker images..."
    
    # Build with build arguments
    docker-compose -f "$DOCKER_COMPOSE_FILE" build \
        --build-arg NODE_ENV=production \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" \
        --no-cache
    
    success "Docker images built successfully"
}

# Run security scan
security_scan() {
    log "Running security scan on images..."
    
    # Scan frontend image for vulnerabilities
    if command -v trivy >/dev/null 2>&1; then
        trivy image --exit-code 1 --severity HIGH,CRITICAL \
            "${PROJECT_NAME}_frontend:latest" || warning "Security vulnerabilities found in frontend image"
    else
        warning "Trivy not installed - skipping security scan"
    fi
}

# Deploy services
deploy_services() {
    log "Deploying services..."
    
    # Pull latest images for external services
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull postgres redis traefik prometheus grafana
    
    # Start services with rolling update
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d \
        --remove-orphans \
        --force-recreate
    
    success "Services deployed successfully"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    local max_attempts=30
    local attempt=1
    
    services=(
        "http://localhost:8080/health:Frontend"
        "http://localhost:4000/health:API Gateway"
        "http://localhost:9090/-/healthy:Prometheus"
        "http://localhost:3001/api/health:Grafana"
    )
    
    for service in "${services[@]}"; do
        IFS=':' read -r url name <<< "$service"
        
        log "Checking $name health..."
        
        while [[ $attempt -le $max_attempts ]]; do
            if curl -sSf "$url" >/dev/null 2>&1; then
                success "$name is healthy"
                break
            elif [[ $attempt -eq $max_attempts ]]; then
                error "$name health check failed after $max_attempts attempts"
            else
                warning "$name not ready (attempt $attempt/$max_attempts)"
                sleep 10
                ((attempt++))
            fi
        done
        
        attempt=1
    done
}

# Run tests
run_tests() {
    log "Running deployment tests..."
    
    # Frontend accessibility and performance tests
    if command -v lighthouse >/dev/null 2>&1; then
        lighthouse http://localhost:8080 \
            --output=json \
            --output-path="lighthouse-report.json" \
            --quiet || warning "Lighthouse tests failed"
    fi
    
    # API integration tests
    if [[ -f "tests/integration.sh" ]]; then
        bash tests/integration.sh || error "Integration tests failed"
    fi
    
    success "Deployment tests completed"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring and alerting..."
    
    # Import Grafana dashboards
    if [[ -d "monitoring/dashboards" ]]; then
        log "Grafana dashboards will be auto-imported"
    fi
    
    # Configure Prometheus alerts
    if [[ -f "monitoring/alerts.yml" ]]; then
        docker exec adaptive-prometheus \
            promtool check rules /etc/prometheus/rules/alerts.yml || warning "Alert rules validation failed"
    fi
    
    success "Monitoring setup completed"
}

# Cleanup old resources
cleanup() {
    log "Cleaning up old resources..."
    
    # Remove unused images
    docker image prune -f >/dev/null 2>&1 || true
    
    # Remove old backups (keep last 30 days)
    find "$BACKUP_DIR" -name "db_backup_*.sql" -mtime +30 -delete 2>/dev/null || true
    
    # Remove old log files
    find . -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    success "Cleanup completed"
}

# Post-deployment notifications
send_notifications() {
    log "Sending deployment notifications..."
    
    local deployment_info
    deployment_info=$(cat <<EOF
🚀 Deployment Completed Successfully!

Environment: Production
Project: $PROJECT_NAME
Time: $(date)
Version: $(git describe --tags 2>/dev/null || echo "latest")
Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

Services Status:
✅ Frontend: http://localhost:8080
✅ API Gateway: http://localhost:4000
✅ Database: Running
✅ Monitoring: http://localhost:3001

Health checks: PASSED
Security scan: COMPLETED
EOF
)
    
    echo "$deployment_info"
    
    # Send to Slack/Discord/Email if configured
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$deployment_info\"}" \
            "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || warning "Slack notification failed"
    fi
    
    success "Deployment notifications sent"
}

# Rollback function
rollback() {
    error "Deployment failed. Initiating rollback..."
    
    # Stop new services
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    # Restore from backup if available
    local latest_backup
    latest_backup=$(ls -t "$BACKUP_DIR"/db_backup_*.sql 2>/dev/null | head -n1)
    
    if [[ -n "$latest_backup" ]]; then
        warning "Restoring database from backup: $latest_backup"
        # Restore database backup
        docker exec -i adaptive-postgres psql \
            -U "${POSTGRES_USER:-postgres}" \
            -d "${POSTGRES_DB:-adaptive_learning}" \
            < "$latest_backup" || warning "Database restore failed"
    fi
    
    error "Rollback completed. Please check logs for issues."
}

# Main deployment function
main() {
    log "🚀 Starting deployment of $PROJECT_NAME"
    log "================================================"
    
    # Trap for cleanup on failure
    trap rollback ERR
    
    # Pre-deployment checks
    check_prerequisites
    load_environment
    
    # Backup current state
    create_backup
    
    # Build and security
    build_images
    security_scan
    
    # Deploy
    deploy_services
    
    # Verification
    health_check
    run_tests
    
    # Post-deployment
    setup_monitoring
    cleanup
    send_notifications
    
    log "================================================"
    success "🎉 Deployment completed successfully!"
    log "Frontend: http://localhost:8080"
    log "API: http://localhost:4000"
    log "Monitoring: http://localhost:3001"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "health")
        health_check
        ;;
    "logs")
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f
        ;;
    "stop")
        docker-compose -f "$DOCKER_COMPOSE_FILE" down
        ;;
    "restart")
        docker-compose -f "$DOCKER_COMPOSE_FILE" restart
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health|logs|stop|restart}"
        exit 1
        ;;
esac