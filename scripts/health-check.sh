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
