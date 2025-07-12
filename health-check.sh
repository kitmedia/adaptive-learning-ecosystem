#!/bin/bash

# 🏥 ADAPTIVE LEARNING ECOSYSTEM - HEALTH CHECK SCRIPT
# EbroValley Digital - Comprehensive Health Monitoring
# Version: 1.0.0

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Health check results
HEALTHY_SERVICES=()
UNHEALTHY_SERVICES=()
TOTAL_SERVICES=0

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

echo -e "${PURPLE}
╔══════════════════════════════════════════════════════════════╗
║               🏥 ECOSYSTEM HEALTH CHECK                     ║
║                  Comprehensive Monitoring                   ║
╚══════════════════════════════════════════════════════════════╝
${NC}"

# Service definitions
declare -A SERVICES=(
    ["Analytics"]="http://localhost:5003/health"
    ["AI-Tutor"]="http://localhost:5004/health"
    ["Collaboration"]="http://localhost:5002/health"
    ["Content Intelligence"]="http://localhost:5005/health"
    ["Content Management"]="http://localhost:5001/health"
    ["Notifications"]="http://localhost:5006/health"
    ["Progress Tracking"]="http://localhost:5007/health"
)

# Infrastructure checks
declare -A INFRASTRUCTURE=(
    ["Redis"]="redis://localhost:6379"
    ["SQLite"]="/home/shockman/HERMANDAD-DIGITAL-WORKSPACE/adaptive-learning-ecosystem/database/adaptive_learning.db"
    ["API Gateway"]="http://localhost:3001"
    ["Frontend"]="http://localhost:4173"
)

# Function to check HTTP endpoint
check_http_endpoint() {
    local name=$1
    local url=$2
    local timeout=5
    
    if curl -s --max-time $timeout "$url" >/dev/null 2>&1; then
        local response=$(curl -s --max-time $timeout "$url" 2>/dev/null)
        if [[ $response == *"healthy"* ]] || [[ $response == *"ok"* ]] || [[ $response == *"200"* ]]; then
            success "$name - Healthy"
            HEALTHY_SERVICES+=("$name")
            return 0
        else
            warning "$name - Responding but not healthy"
            UNHEALTHY_SERVICES+=("$name")
            return 1
        fi
    else
        error "$name - Not responding"
        UNHEALTHY_SERVICES+=("$name")
        return 1
    fi
}

# Function to check Redis
check_redis() {
    local redis_dir="/home/shockman/HERMANDAD-DIGITAL-WORKSPACE/adaptive-learning-ecosystem/services/ai-tutor/redis-stable"
    
    if [ -f "$redis_dir/local/bin/redis-cli" ]; then
        if $redis_dir/local/bin/redis-cli ping >/dev/null 2>&1; then
            success "Redis - Healthy (PONG received)"
            return 0
        else
            error "Redis - Not responding to PING"
            return 1
        fi
    else
        error "Redis - CLI not found"
        return 1
    fi
}

# Function to check SQLite
check_sqlite() {
    local db_path=$1
    
    if [ -f "$db_path" ]; then
        if [ -r "$db_path" ]; then
            success "SQLite Database - Healthy (file accessible)"
            return 0
        else
            error "SQLite Database - File not readable"
            return 1
        fi
    else
        error "SQLite Database - File not found"
        return 1
    fi
}

# Main health checks
log "🔍 Starting comprehensive health check..."

# Check microservices
log "🔬 Checking microservices..."
for service in "${!SERVICES[@]}"; do
    check_http_endpoint "$service" "${SERVICES[$service]}"
    ((TOTAL_SERVICES++))
done

# Check infrastructure
log "🏗️ Checking infrastructure..."

# Redis check
if check_redis; then
    HEALTHY_SERVICES+=("Redis")
else
    UNHEALTHY_SERVICES+=("Redis")
fi

# SQLite check  
if check_sqlite "${INFRASTRUCTURE["SQLite"]}"; then
    HEALTHY_SERVICES+=("SQLite")
else
    UNHEALTHY_SERVICES+=("SQLite")
fi

# API Gateway check
if curl -s --max-time 5 "${INFRASTRUCTURE["API Gateway"]}" >/dev/null 2>&1; then
    success "API Gateway - Healthy"
    HEALTHY_SERVICES+=("API Gateway")
else
    warning "API Gateway - Not responding"
    UNHEALTHY_SERVICES+=("API Gateway")
fi

# Frontend check
if curl -s --max-time 5 "${INFRASTRUCTURE["Frontend"]}" >/dev/null 2>&1; then
    success "Frontend - Healthy"
    HEALTHY_SERVICES+=("Frontend")
else
    warning "Frontend - Not responding"
    UNHEALTHY_SERVICES+=("Frontend")
fi

# Performance metrics
log "📊 Gathering performance metrics..."

# Memory usage
echo -e "${CYAN}💾 Memory Usage:${NC}"
free -h | grep -E "Mem|Swap"

# Disk usage
echo -e "\n${CYAN}💿 Disk Usage:${NC}"
df -h | grep -E "/$|database"

# CPU load
echo -e "\n${CYAN}⚡ CPU Load:${NC}"
uptime

# Process count
echo -e "\n${CYAN}🔄 Active Processes:${NC}"
echo "Total Python processes: $(pgrep -c python3 || echo 0)"
echo "Total Node processes: $(pgrep -c node || echo 0)"
echo "Redis processes: $(pgrep -c redis-server || echo 0)"

# Network connections
echo -e "\n${CYAN}🌐 Network Connections:${NC}"
for port in 5001 5002 5003 5004 5005 5006 5007 3001 4173 6379; do
    if lsof -Pi :$port -sTCP:LISTEN >/dev/null 2>&1; then
        echo "  Port $port: ✅ LISTENING"
    else
        echo "  Port $port: ❌ NOT LISTENING"
    fi
done

# Summary
echo -e "\n${PURPLE}
╔══════════════════════════════════════════════════════════════╗
║                    📋 HEALTH SUMMARY                        ║
╚══════════════════════════════════════════════════════════════╝
${NC}"

echo -e "${GREEN}✅ Healthy Components (${#HEALTHY_SERVICES[@]}):${NC}"
for service in "${HEALTHY_SERVICES[@]}"; do
    echo -e "  ✓ $service"
done

if [ ${#UNHEALTHY_SERVICES[@]} -gt 0 ]; then
    echo -e "\n${RED}❌ Unhealthy Components (${#UNHEALTHY_SERVICES[@]}):${NC}"
    for service in "${UNHEALTHY_SERVICES[@]}"; do
        echo -e "  ✗ $service"
    done
fi

# Overall status
HEALTH_PERCENTAGE=$(( (${#HEALTHY_SERVICES[@]} * 100) / (${#HEALTHY_SERVICES[@]} + ${#UNHEALTHY_SERVICES[@]}) ))

echo -e "\n${BLUE}📊 Overall Ecosystem Health: ${HEALTH_PERCENTAGE}%${NC}"

if [ $HEALTH_PERCENTAGE -ge 90 ]; then
    echo -e "${GREEN}🎉 Ecosystem Status: EXCELLENT${NC}"
    exit 0
elif [ $HEALTH_PERCENTAGE -ge 70 ]; then
    echo -e "${YELLOW}⚠️  Ecosystem Status: GOOD (some issues detected)${NC}"
    exit 1
else
    echo -e "${RED}🚨 Ecosystem Status: CRITICAL (multiple failures)${NC}"
    exit 2
fi