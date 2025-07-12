#!/bin/bash

# 🚀 ADAPTIVE LEARNING ECOSYSTEM - STARTUP SCRIPT
# EbroValley Digital - Automated Ecosystem Launcher
# Version: 1.0.0 - Production Ready

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
ECOSYSTEM_DIR="/home/shockman/HERMANDAD-DIGITAL-WORKSPACE/adaptive-learning-ecosystem"
REDIS_DIR="$ECOSYSTEM_DIR/services/ai-tutor/redis-stable"
SERVICES_DIR="$ECOSYSTEM_DIR/services"
FRONTEND_DIR="$ECOSYSTEM_DIR/frontend"
API_GATEWAY_DIR="$ECOSYSTEM_DIR/api-gateway"

# Service ports
declare -A SERVICE_PORTS=(
    ["analytics"]="5003"
    ["ai-tutor"]="5004"
    ["collaboration"]="5002"
    ["content-intelligence"]="5005"
    ["content-management"]="5001"
    ["notifications"]="5006"
    ["progress-tracking"]="5007"
)

# Logging function
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

info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Header
echo -e "${PURPLE}
╔══════════════════════════════════════════════════════════════╗
║               🚀 ADAPTIVE LEARNING ECOSYSTEM                 ║
║                  AUTOMATED STARTUP SCRIPT                   ║
║                     EbroValley Digital                      ║
╚══════════════════════════════════════════════════════════════╝
${NC}"

# Check if we're in the right directory
if [ ! -d "$ECOSYSTEM_DIR" ]; then
    error "Ecosystem directory not found: $ECOSYSTEM_DIR"
    exit 1
fi

cd "$ECOSYSTEM_DIR"

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1  # Port is busy
    else
        return 0  # Port is available
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    info "Waiting for $service_name to be ready on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$port/health" >/dev/null 2>&1; then
            success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    error "$service_name failed to start within $((max_attempts * 2)) seconds"
    return 1
}

# Pre-flight checks
log "🔍 Running pre-flight checks..."

# Check if Redis is running
if ! pgrep -f redis-server >/dev/null; then
    log "🔧 Starting Redis server..."
    cd "$REDIS_DIR"
    ./local/bin/redis-server --daemonize yes --port 6379
    sleep 2
    
    if ./local/bin/redis-cli ping >/dev/null 2>&1; then
        success "Redis server started successfully"
    else
        error "Failed to start Redis server"
        exit 1
    fi
    cd "$ECOSYSTEM_DIR"
else
    success "Redis server is already running"
fi

# Check database
if [ -f "$ECOSYSTEM_DIR/database/adaptive_learning.db" ]; then
    success "SQLite database found"
else
    warning "SQLite database not found, services may have issues"
fi

# Check virtual environments
log "🔍 Checking virtual environments..."
missing_venvs=()
for service in "${!SERVICE_PORTS[@]}"; do
    if [ ! -d "$SERVICES_DIR/$service/venv" ]; then
        missing_venvs+=("$service")
    fi
done

if [ ${#missing_venvs[@]} -gt 0 ]; then
    error "Missing virtual environments for: ${missing_venvs[*]}"
    exit 1
else
    success "All virtual environments found"
fi

# Start services
log "🚀 Starting microservices..."

# Array to store service PIDs
declare -A SERVICE_PIDS

# Function to start a service
start_service() {
    local service_name=$1
    local port=${SERVICE_PORTS[$service_name]}
    
    info "Starting $service_name on port $port..."
    
    # Check if port is available
    if ! check_port $port; then
        warning "Port $port is already in use for $service_name"
        return 1
    fi
    
    # Start the service
    cd "$SERVICES_DIR/$service_name"
    
    # Activate virtual environment and start service
    source venv/bin/activate
    nohup python main.py > "$service_name.log" 2>&1 &
    local pid=$!
    SERVICE_PIDS[$service_name]=$pid
    
    info "$service_name started with PID $pid"
    cd "$ECOSYSTEM_DIR"
    
    return 0
}

# Start all services
for service in "${!SERVICE_PORTS[@]}"; do
    start_service "$service"
    sleep 1  # Brief pause between service starts
done

# Wait for services to be ready
log "⏳ Waiting for services to initialize..."
sleep 5

# Health check all services
log "🏥 Performing health checks..."
failed_services=()

for service in "${!SERVICE_PORTS[@]}"; do
    port=${SERVICE_PORTS[$service]}
    if wait_for_service "$service" "$port"; then
        success "$service health check passed"
    else
        error "$service health check failed"
        failed_services+=("$service")
    fi
done

# Start API Gateway
log "🌐 Starting API Gateway..."
if [ -d "$API_GATEWAY_DIR" ]; then
    cd "$API_GATEWAY_DIR"
    if [ -f "package.json" ]; then
        if ! check_port 3001; then
            warning "Port 3001 is already in use for API Gateway"
        else
            npm run start:dev > api-gateway.log 2>&1 &
            API_GATEWAY_PID=$!
            info "API Gateway started with PID $API_GATEWAY_PID"
            sleep 3
            success "API Gateway started on port 3001"
        fi
    else
        warning "API Gateway package.json not found"
    fi
    cd "$ECOSYSTEM_DIR"
else
    warning "API Gateway directory not found"
fi

# Start Frontend
log "🎨 Starting Frontend..."
if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR"
    if [ -f "package.json" ]; then
        if ! check_port 4173; then
            warning "Port 4173 is already in use for Frontend"
        else
            npm run preview > frontend.log 2>&1 &
            FRONTEND_PID=$!
            info "Frontend started with PID $FRONTEND_PID"
            sleep 3
            success "Frontend started on port 4173"
        fi
    else
        warning "Frontend package.json not found"
    fi
    cd "$ECOSYSTEM_DIR"
else
    warning "Frontend directory not found"
fi

# Summary
echo -e "\n${PURPLE}
╔══════════════════════════════════════════════════════════════╗
║                    🎉 STARTUP COMPLETE                      ║
╚══════════════════════════════════════════════════════════════╝
${NC}"

log "📊 Service Status Summary:"
for service in "${!SERVICE_PORTS[@]}"; do
    port=${SERVICE_PORTS[$service]}
    if [[ " ${failed_services[@]} " =~ " ${service} " ]]; then
        echo -e "  ${RED}❌ $service${NC} - http://localhost:$port (FAILED)"
    else
        echo -e "  ${GREEN}✅ $service${NC} - http://localhost:$port"
    fi
done

echo -e "\n${CYAN}🌐 Web Interfaces:${NC}"
echo -e "  ${GREEN}🎨 Frontend${NC}     - http://localhost:4173"
echo -e "  ${GREEN}🚪 API Gateway${NC}  - http://localhost:3001"
echo -e "  ${GREEN}🔧 Redis${NC}        - localhost:6379"

echo -e "\n${YELLOW}📋 Useful Commands:${NC}"
echo -e "  ${CYAN}View logs:${NC}        tail -f services/*/\*.log"
echo -e "  ${CYAN}Stop ecosystem:${NC}   ./stop-ecosystem.sh"
echo -e "  ${CYAN}Monitor status:${NC}   ./monitor-ecosystem.sh"

if [ ${#failed_services[@]} -gt 0 ]; then
    echo -e "\n${RED}⚠️  Some services failed to start: ${failed_services[*]}${NC}"
    echo -e "${YELLOW}Check the logs for more details.${NC}"
    exit 1
else
    echo -e "\n${GREEN}🚀 All services started successfully!${NC}"
    echo -e "${PURPLE}🎉 Adaptive Learning Ecosystem is now running!${NC}"
fi