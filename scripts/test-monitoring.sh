#!/bin/bash

# Test Monitoring Setup - Adaptive Learning Ecosystem
# EbroValley Digital - Verify monitoring stack is working

set -e

echo "🔍 Testing Monitoring Stack..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test functions
test_api_gateway_metrics() {
    echo -e "${BLUE}Testing API Gateway metrics endpoint...${NC}"
    
    cd api-gateway
    npm run build > /dev/null 2>&1
    
    # Start server in background
    npm run start:prod > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 3
    
    # Test metrics endpoint
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/metrics || echo "000")
    
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ API Gateway metrics endpoint working${NC}"
    else
        echo -e "${RED}❌ API Gateway metrics endpoint failed (HTTP $RESPONSE)${NC}"
    fi
    
    # Cleanup
    kill $SERVER_PID 2>/dev/null || true
    cd ..
}

test_ai_tutor_metrics() {
    echo -e "${BLUE}Testing AI Tutor metrics endpoint...${NC}"
    
    cd services/ai-tutor
    
    # Start server in background
    python3 main.py > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 5
    
    # Test metrics endpoint
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/metrics || echo "000")
    
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ AI Tutor metrics endpoint working${NC}"
    else
        echo -e "${RED}❌ AI Tutor metrics endpoint failed (HTTP $RESPONSE)${NC}"
    fi
    
    # Test health endpoint with enhanced metrics
    HEALTH_RESPONSE=$(curl -s http://localhost:5001/health | jq -r '.status' 2>/dev/null || echo "error")
    
    if [ "$HEALTH_RESPONSE" = "healthy" ]; then
        echo -e "${GREEN}✅ AI Tutor enhanced health check working${NC}"
    else
        echo -e "${RED}❌ AI Tutor health check failed${NC}"
    fi
    
    # Cleanup
    kill $SERVER_PID 2>/dev/null || true
    cd ../..
}

test_prometheus_config() {
    echo -e "${BLUE}Testing Prometheus configuration...${NC}"
    
    if [ -f "monitoring/prometheus.yml" ]; then
        echo -e "${GREEN}✅ Prometheus configuration file exists${NC}"
        
        # Check for required job names
        if grep -q "api-gateway" monitoring/prometheus.yml; then
            echo -e "${GREEN}✅ API Gateway job configured${NC}"
        else
            echo -e "${RED}❌ API Gateway job missing${NC}"
        fi
        
        if grep -q "ai-tutor" monitoring/prometheus.yml; then
            echo -e "${GREEN}✅ AI Tutor job configured${NC}"
        else
            echo -e "${RED}❌ AI Tutor job missing${NC}"
        fi
    else
        echo -e "${RED}❌ Prometheus configuration file missing${NC}"
    fi
}

test_grafana_config() {
    echo -e "${BLUE}Testing Grafana configuration...${NC}"
    
    if [ -d "monitoring/grafana/provisioning" ]; then
        echo -e "${GREEN}✅ Grafana provisioning directory exists${NC}"
        
        if [ -f "monitoring/grafana/provisioning/datasources/prometheus.yaml" ]; then
            echo -e "${GREEN}✅ Prometheus datasource configured${NC}"
        else
            echo -e "${RED}❌ Prometheus datasource missing${NC}"
        fi
        
        if [ -f "monitoring/grafana/provisioning/dashboards/adaptive-learning-dashboard.json" ]; then
            echo -e "${GREEN}✅ Dashboard configuration exists${NC}"
        else
            echo -e "${RED}❌ Dashboard configuration missing${NC}"
        fi
    else
        echo -e "${RED}❌ Grafana provisioning directory missing${NC}"
    fi
}

test_alert_rules() {
    echo -e "${BLUE}Testing Alert Rules configuration...${NC}"
    
    if [ -f "monitoring/alert_rules.yml" ]; then
        echo -e "${GREEN}✅ Alert rules file exists${NC}"
        
        # Check for critical alerts
        if grep -q "ServiceDown" monitoring/alert_rules.yml; then
            echo -e "${GREEN}✅ Service Down alert configured${NC}"
        else
            echo -e "${RED}❌ Service Down alert missing${NC}"
        fi
        
        if grep -q "HighErrorRate" monitoring/alert_rules.yml; then
            echo -e "${GREEN}✅ High Error Rate alert configured${NC}"
        else
            echo -e "${RED}❌ High Error Rate alert missing${NC}"
        fi
    else
        echo -e "${RED}❌ Alert rules file missing${NC}"
    fi
}

# Main execution
echo -e "${YELLOW}🚀 Starting Monitoring Stack Tests${NC}"
echo ""

test_prometheus_config
echo ""

test_grafana_config
echo ""

test_alert_rules
echo ""

test_api_gateway_metrics
echo ""

test_ai_tutor_metrics
echo ""

echo -e "${YELLOW}🎯 Monitoring Stack Test Complete${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "1. Start monitoring stack: docker-compose --profile monitoring up -d"
echo -e "2. Access Prometheus: http://localhost:9090"
echo -e "3. Access Grafana: http://localhost:3001 (admin/adaptive_grafana_2024)"
echo -e "4. Monitor metrics in real-time dashboards"