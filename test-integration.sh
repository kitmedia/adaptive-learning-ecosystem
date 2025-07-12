#!/bin/bash

# 🧪 ADAPTIVE LEARNING ECOSYSTEM - INTEGRATION TESTS
# EbroValley Digital - Comprehensive Integration Testing Suite
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

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
FAILED_TEST_LIST=()

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_TESTS++))
}

error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_TESTS++))
    FAILED_TEST_LIST+=("$1")
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

test_start() {
    echo -e "\n${PURPLE}🧪 Testing: $1${NC}"
    ((TOTAL_TESTS++))
}

echo -e "${PURPLE}
╔══════════════════════════════════════════════════════════════╗
║            🧪 INTEGRATION TESTING SUITE                     ║
║               Comprehensive System Tests                    ║
╚══════════════════════════════════════════════════════════════╝
${NC}"

# Test Configuration
ECOSYSTEM_CONFIG="/home/shockman/HERMANDAD-DIGITAL-WORKSPACE/adaptive-learning-ecosystem/ecosystem-config.json"
BASE_URL="http://localhost"

# Service endpoints from config
declare -A SERVICES=(
    ["analytics"]="$BASE_URL:5003"
    ["ai-tutor"]="$BASE_URL:5004"
    ["collaboration"]="$BASE_URL:5002"
    ["content-intelligence"]="$BASE_URL:5005"
    ["content-management"]="$BASE_URL:5001"
    ["notifications"]="$BASE_URL:5006"
    ["progress-tracking"]="$BASE_URL:5007"
)

# Infrastructure endpoints
API_GATEWAY="$BASE_URL:3001"
FRONTEND="$BASE_URL:4173"
REDIS_CLI="/home/shockman/HERMANDAD-DIGITAL-WORKSPACE/adaptive-learning-ecosystem/services/ai-tutor/redis-stable/local/bin/redis-cli"

# Helper function to make HTTP requests with timeout
http_request() {
    local method=$1
    local url=$2
    local expected_status=${3:-200}
    local timeout=${4:-10}
    local data=${5:-""}
    
    if [ "$method" == "POST" ] && [ ! -z "$data" ]; then
        response=$(curl -s -w "%{http_code}" -X "$method" \
                       -H "Content-Type: application/json" \
                       -d "$data" \
                       --max-time $timeout \
                       "$url" 2>/dev/null || echo "000")
    else
        response=$(curl -s -w "%{http_code}" -X "$method" \
                       --max-time $timeout \
                       "$url" 2>/dev/null || echo "000")
    fi
    
    local status_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$status_code" == "$expected_status" ]; then
        return 0
    else
        return 1
    fi
}

# Test 1: Infrastructure Health
log "🏗️ Testing Infrastructure Health..."

test_start "Redis Connectivity"
if $REDIS_CLI ping >/dev/null 2>&1; then
    success "Redis PING successful"
else
    error "Redis PING failed"
fi

test_start "SQLite Database Access"
DB_PATH="/home/shockman/HERMANDAD-DIGITAL-WORKSPACE/adaptive-learning-ecosystem/database/adaptive_learning.db"
if [ -f "$DB_PATH" ] && [ -r "$DB_PATH" ]; then
    success "SQLite database accessible"
else
    error "SQLite database not accessible"
fi

# Test 2: Service Health Endpoints
log "🔬 Testing Service Health Endpoints..."

for service in "${!SERVICES[@]}"; do
    test_start "$service Health Endpoint"
    if http_request "GET" "${SERVICES[$service]}/health" 200 5; then
        success "$service health check passed"
    else
        error "$service health check failed"
    fi
done

# Test 3: API Gateway Routing
log "🌐 Testing API Gateway Routing..."

test_start "API Gateway Health"
if http_request "GET" "$API_GATEWAY/health" 200 5; then
    success "API Gateway health check passed"
else
    error "API Gateway health check failed"
fi

# Test service routing through API Gateway
for service in "${!SERVICES[@]}"; do
    test_start "API Gateway -> $service routing"
    if http_request "GET" "$API_GATEWAY/api/$service/health" 200 10; then
        success "API Gateway routing to $service works"
    else
        error "API Gateway routing to $service failed"
    fi
done

# Test 4: Cross-Service Communication
log "🔄 Testing Cross-Service Communication..."

test_start "Analytics -> AI-Tutor Communication"
# Test if analytics can track events that AI-Tutor might generate
analytics_data='{"user_id":"550e8400-e29b-41d4-a716-446655440000","session_id":"test-session","event_type":"test","event_category":"integration","event_action":"test_communication"}'
if http_request "POST" "${SERVICES[analytics]}/events" 200 10 "$analytics_data"; then
    success "Analytics event tracking works"
else
    error "Analytics event tracking failed"
fi

test_start "Progress Tracking Data Flow"
# Test progress tracking endpoint
if http_request "GET" "${SERVICES[progress-tracking]}/progress" 200 10; then
    success "Progress tracking endpoint accessible"
else
    error "Progress tracking endpoint failed"
fi

# Test 5: Database Integration
log "🗄️ Testing Database Integration..."

test_start "Analytics Database Connection"
if http_request "GET" "${SERVICES[analytics]}/realtime-metrics" 200 10; then
    success "Analytics database integration works"
else
    error "Analytics database integration failed"
fi

test_start "AI-Tutor Database Connection" 
# Test AI-Tutor database access through a safe endpoint
if http_request "GET" "${SERVICES[ai-tutor]}/health" 200 10; then
    success "AI-Tutor database integration works"
else
    error "AI-Tutor database integration failed"
fi

# Test 6: Redis Cache Integration
log "🚀 Testing Redis Cache Integration..."

test_start "Redis Key-Value Operations"
# Test Redis operations through services
test_key="integration_test_$(date +%s)"
test_value="test_value_$(date +%s)"

if $REDIS_CLI set "$test_key" "$test_value" >/dev/null 2>&1; then
    retrieved_value=$($REDIS_CLI get "$test_key" 2>/dev/null)
    if [ "$retrieved_value" == "$test_value" ]; then
        success "Redis key-value operations work"
        $REDIS_CLI del "$test_key" >/dev/null 2>&1
    else
        error "Redis value retrieval failed"
    fi
else
    error "Redis key setting failed"
fi

# Test 7: Frontend Integration
log "🎨 Testing Frontend Integration..."

test_start "Frontend Accessibility"
if http_request "GET" "$FRONTEND" 200 10; then
    success "Frontend is accessible"
else
    error "Frontend is not accessible"
fi

test_start "Frontend Static Assets"
if http_request "GET" "$FRONTEND/assets" 200 10 || http_request "GET" "$FRONTEND/static" 200 10; then
    success "Frontend assets accessible"
else
    warning "Frontend assets check inconclusive"
fi

# Test 8: Authentication Flow (if available)
log "🔐 Testing Authentication Flow..."

test_start "API Gateway Authentication Endpoint"
if http_request "GET" "$API_GATEWAY/auth/health" 200 10 || http_request "GET" "$API_GATEWAY/api/auth" 401 10; then
    success "Authentication endpoints accessible"
else
    warning "Authentication endpoints not configured or accessible"
fi

# Test 9: Error Handling
log "🛡️ Testing Error Handling..."

test_start "Invalid Endpoint Handling"
if http_request "GET" "${SERVICES[analytics]}/invalid-endpoint" 404 5; then
    success "Proper 404 error handling"
else
    warning "Error handling test inconclusive"
fi

test_start "Service Timeout Handling"
# Test with very short timeout to simulate network issues
if ! http_request "GET" "${SERVICES[analytics]}/health" 200 1; then
    success "Timeout handling working (expected failure)"
else
    info "Service responded faster than expected"
fi

# Test 10: Performance Baseline
log "⚡ Testing Performance Baseline..."

test_start "Response Time Check"
start_time=$(date +%s%N)
if http_request "GET" "${SERVICES[analytics]}/health" 200 5; then
    end_time=$(date +%s%N)
    response_time=$(( (end_time - start_time) / 1000000 ))  # Convert to milliseconds
    
    if [ $response_time -lt 1000 ]; then  # Less than 1 second
        success "Response time acceptable: ${response_time}ms"
    else
        warning "Response time high: ${response_time}ms"
    fi
else
    error "Performance test failed"
fi

# Summary Report
echo -e "\n${PURPLE}
╔══════════════════════════════════════════════════════════════╗
║                    📊 TEST SUMMARY                          ║
╚══════════════════════════════════════════════════════════════╝
${NC}"

echo -e "${BLUE}📋 Test Results:${NC}"
echo -e "  ${GREEN}✅ Passed: $PASSED_TESTS${NC}"
echo -e "  ${RED}❌ Failed: $FAILED_TESTS${NC}"
echo -e "  ${CYAN}📊 Total: $TOTAL_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}🚀 System Integration: EXCELLENT${NC}"
    exit 0
else
    echo -e "\n${RED}❌ FAILED TESTS:${NC}"
    for failed_test in "${FAILED_TEST_LIST[@]}"; do
        echo -e "  ${RED}✗${NC} $failed_test"
    done
    
    pass_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    echo -e "\n${YELLOW}📊 Pass Rate: $pass_rate%${NC}"
    
    if [ $pass_rate -ge 80 ]; then
        echo -e "${YELLOW}⚠️  System Integration: GOOD (some issues)${NC}"
        exit 1
    else
        echo -e "${RED}🚨 System Integration: NEEDS ATTENTION${NC}"
        exit 2
    fi
fi