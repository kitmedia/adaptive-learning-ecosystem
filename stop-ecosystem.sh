#!/bin/bash

# 🛑 ADAPTIVE LEARNING ECOSYSTEM - SHUTDOWN SCRIPT
# EbroValley Digital - Graceful Ecosystem Shutdown
# Version: 1.0.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo -e "${PURPLE}
╔══════════════════════════════════════════════════════════════╗
║               🛑 STOPPING ECOSYSTEM                         ║
║                 Graceful Shutdown                           ║
╚══════════════════════════════════════════════════════════════╝
${NC}"

# Service ports to check
declare -A SERVICE_PORTS=(
    ["analytics"]="5003"
    ["ai-tutor"]="5004"
    ["collaboration"]="5002"
    ["content-intelligence"]="5005"
    ["content-management"]="5001"
    ["notifications"]="5006"
    ["progress-tracking"]="5007"
)

# Stop services by port
log "🛑 Stopping microservices..."
for service in "${!SERVICE_PORTS[@]}"; do
    port=${SERVICE_PORTS[$service]}
    pid=$(lsof -ti:$port 2>/dev/null || echo "")
    
    if [ ! -z "$pid" ]; then
        log "Stopping $service (PID: $pid, Port: $port)"
        kill -TERM $pid 2>/dev/null || true
        sleep 2
        
        # Force kill if still running
        if kill -0 $pid 2>/dev/null; then
            warning "Force killing $service"
            kill -KILL $pid 2>/dev/null || true
        fi
        success "$service stopped"
    else
        info "$service was not running"
    fi
done

# Stop API Gateway
log "🌐 Stopping API Gateway..."
api_pid=$(lsof -ti:3001 2>/dev/null || echo "")
if [ ! -z "$api_pid" ]; then
    kill -TERM $api_pid 2>/dev/null || true
    sleep 2
    if kill -0 $api_pid 2>/dev/null; then
        kill -KILL $api_pid 2>/dev/null || true
    fi
    success "API Gateway stopped"
else
    info "API Gateway was not running"
fi

# Stop Frontend  
log "🎨 Stopping Frontend..."
frontend_pid=$(lsof -ti:4173 2>/dev/null || echo "")
if [ ! -z "$frontend_pid" ]; then
    kill -TERM $frontend_pid 2>/dev/null || true
    sleep 2
    if kill -0 $frontend_pid 2>/dev/null; then
        kill -KILL $frontend_pid 2>/dev/null || true
    fi
    success "Frontend stopped"
else
    info "Frontend was not running"
fi

# Stop Redis (optional - comment out if you want to keep Redis running)
log "🔧 Stopping Redis..."
redis_pid=$(pgrep -f redis-server || echo "")
if [ ! -z "$redis_pid" ]; then
    cd /home/shockman/HERMANDAD-DIGITAL-WORKSPACE/adaptive-learning-ecosystem/services/ai-tutor/redis-stable
    ./local/bin/redis-cli shutdown 2>/dev/null || true
    success "Redis stopped"
else
    info "Redis was not running"
fi

# Clean up log files (optional)
log "🧹 Cleaning up..."
find /home/shockman/HERMANDAD-DIGITAL-WORKSPACE/adaptive-learning-ecosystem/services -name "*.log" -delete 2>/dev/null || true
find /home/shockman/HERMANDAD-DIGITAL-WORKSPACE/adaptive-learning-ecosystem -maxdepth 1 -name "*.log" -delete 2>/dev/null || true

echo -e "\n${GREEN}🎉 Ecosystem stopped successfully!${NC}"
echo -e "${BLUE}All services have been gracefully shut down.${NC}"