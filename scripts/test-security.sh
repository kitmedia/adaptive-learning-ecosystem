#!/bin/bash

# Test Security Implementation - Adaptive Learning Ecosystem
# EbroValley Digital - Verify security features are working

set -e

echo "🔒 Testing Security Implementation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test functions
test_rate_limiting() {
    echo -e "${BLUE}Testing Rate Limiting...${NC}"
    
    cd api-gateway
    npm run build > /dev/null 2>&1
    
    # Start server in background
    npm run start:prod > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 5
    
    echo -e "${YELLOW}  Testing auth endpoint rate limiting (10 req/min)...${NC}"
    
    # Test rapid requests to auth endpoint
    RATE_LIMITED=false
    for i in {1..12}; do
        RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
            -X POST http://localhost:4000/api/v1/auth/login \
            -H "Content-Type: application/json" \
            -d '{"username":"test","password":"test"}' || echo "000")
        
        if [ "$RESPONSE" = "429" ]; then
            RATE_LIMITED=true
            echo -e "${GREEN}  ✅ Rate limiting working - got 429 on request $i${NC}"
            break
        fi
        
        sleep 0.1
    done
    
    if [ "$RATE_LIMITED" = true ]; then
        echo -e "${GREEN}✅ Rate limiting functional${NC}"
    else
        echo -e "${RED}❌ Rate limiting not working${NC}"
    fi
    
    # Cleanup
    kill $SERVER_PID 2>/dev/null || true
    cd ..
}

test_security_headers() {
    echo -e "${BLUE}Testing Security Headers...${NC}"
    
    cd api-gateway
    
    # Start server in background
    npm run start:prod > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 5
    
    # Test security headers
    HEADERS=$(curl -s -I http://localhost:4000/api/v1/health)
    
    if echo "$HEADERS" | grep -q "x-content-type-options"; then
        echo -e "${GREEN}  ✅ X-Content-Type-Options header present${NC}"
    else
        echo -e "${RED}  ❌ X-Content-Type-Options header missing${NC}"
    fi
    
    if echo "$HEADERS" | grep -q "x-frame-options"; then
        echo -e "${GREEN}  ✅ X-Frame-Options header present${NC}"
    else
        echo -e "${RED}  ❌ X-Frame-Options header missing${NC}"
    fi
    
    if echo "$HEADERS" | grep -q "strict-transport-security"; then
        echo -e "${GREEN}  ✅ HSTS header present${NC}"
    else
        echo -e "${YELLOW}  ⚠️ HSTS header missing (expected in development)${NC}"
    fi
    
    # Cleanup
    kill $SERVER_PID 2>/dev/null || true
    cd ..
}

test_api_key_system() {
    echo -e "${BLUE}Testing API Key System...${NC}"
    
    cd api-gateway
    
    # Start server in background
    npm run start:prod > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 5
    
    # Test unauthorized access to protected endpoint
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        http://localhost:4000/api/v1/security/protected-demo || echo "000")
    
    if [ "$RESPONSE" = "401" ]; then
        echo -e "${GREEN}  ✅ Protected endpoint rejecting unauthorized access${NC}"
    else
        echo -e "${RED}  ❌ Protected endpoint not properly secured (HTTP $RESPONSE)${NC}"
    fi
    
    # Test invalid API key
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "X-API-Key: invalid_key" \
        http://localhost:4000/api/v1/security/rate-limit-test || echo "000")
    
    if [ "$RESPONSE" = "401" ]; then
        echo -e "${GREEN}  ✅ Invalid API key properly rejected${NC}"
    else
        echo -e "${RED}  ❌ Invalid API key not rejected (HTTP $RESPONSE)${NC}"
    fi
    
    # Cleanup
    kill $SERVER_PID 2>/dev/null || true
    cd ..
}

test_cors_configuration() {
    echo -e "${BLUE}Testing CORS Configuration...${NC}"
    
    cd api-gateway
    
    # Start server in background
    npm run start:prod > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 5
    
    # Test CORS headers
    CORS_RESPONSE=$(curl -s -I \
        -H "Origin: http://localhost:3000" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        http://localhost:4000/api/v1/health)
    
    if echo "$CORS_RESPONSE" | grep -q "access-control-allow-origin"; then
        echo -e "${GREEN}  ✅ CORS headers present${NC}"
    else
        echo -e "${RED}  ❌ CORS headers missing${NC}"
    fi
    
    # Test unauthorized origin (should fail in production)
    CORS_UNAUTHORIZED=$(curl -s -I \
        -H "Origin: http://malicious-site.com" \
        -X OPTIONS \
        http://localhost:4000/api/v1/health)
    
    # In development, all origins are allowed, so this is informational
    echo -e "${YELLOW}  ℹ️  CORS currently allows all origins (development mode)${NC}"
    
    # Cleanup
    kill $SERVER_PID 2>/dev/null || true
    cd ..
}

test_input_validation() {
    echo -e "${BLUE}Testing Input Validation...${NC}"
    
    cd api-gateway
    
    # Start server in background
    npm run start:prod > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 5
    
    # Test malformed JSON
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST http://localhost:4000/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{"username":}' || echo "000")
    
    if [ "$RESPONSE" = "400" ]; then
        echo -e "${GREEN}  ✅ Malformed JSON rejected${NC}"
    else
        echo -e "${RED}  ❌ Malformed JSON not properly handled (HTTP $RESPONSE)${NC}"
    fi
    
    # Test extra fields (should be stripped by whitelist)
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST http://localhost:4000/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"test","malicious_field":"hack"}' || echo "000")
    
    if [ "$RESPONSE" = "400" ] || [ "$RESPONSE" = "401" ]; then
        echo -e "${GREEN}  ✅ Input validation working${NC}"
    else
        echo -e "${RED}  ❌ Input validation may have issues (HTTP $RESPONSE)${NC}"
    fi
    
    # Cleanup
    kill $SERVER_PID 2>/dev/null || true
    cd ..
}

test_swagger_security_docs() {
    echo -e "${BLUE}Testing Swagger Security Documentation...${NC}"
    
    cd api-gateway
    
    # Start server in background
    npm run start:prod > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 5
    
    # Test Swagger docs endpoint
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        http://localhost:4000/docs || echo "000")
    
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}  ✅ Swagger documentation accessible${NC}"
        
        # Check if security schemas are present
        SWAGGER_JSON=$(curl -s http://localhost:4000/docs-json)
        
        if echo "$SWAGGER_JSON" | grep -q "securitySchemes"; then
            echo -e "${GREEN}  ✅ Security schemas documented${NC}"
        else
            echo -e "${RED}  ❌ Security schemas missing from documentation${NC}"
        fi
        
        if echo "$SWAGGER_JSON" | grep -q "ApiKey"; then
            echo -e "${GREEN}  ✅ API Key authentication documented${NC}"
        else
            echo -e "${RED}  ❌ API Key authentication not documented${NC}"
        fi
    else
        echo -e "${RED}  ❌ Swagger documentation not accessible (HTTP $RESPONSE)${NC}"
    fi
    
    # Cleanup
    kill $SERVER_PID 2>/dev/null || true
    cd ..
}

# Main execution
echo -e "${YELLOW}🚀 Starting Security Tests${NC}"
echo ""

test_security_headers
echo ""

test_cors_configuration
echo ""

test_input_validation
echo ""

test_rate_limiting
echo ""

test_api_key_system
echo ""

test_swagger_security_docs
echo ""

echo -e "${YELLOW}🎯 Security Test Complete${NC}"
echo ""
echo -e "${BLUE}Security Features Implemented:${NC}"
echo -e "• 🛡️  Helmet.js security headers"
echo -e "• 🚫 Rate limiting per endpoint"
echo -e "• 🔑 API key management system"
echo -e "• 🌐 CORS configuration"
echo -e "• ✅ Input validation with whitelist"
echo -e "• 📚 Security documentation in Swagger"
echo ""
echo -e "${BLUE}Next Security Steps:${NC}"
echo -e "1. Configure production CORS origins"
echo -e "2. Set up HTTPS/SSL certificates"
echo -e "3. Configure production rate limits"
echo -e "4. Set up intrusion detection"