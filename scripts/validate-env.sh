#!/bin/bash

# Environment Variables Validation Script
# Adaptive Learning Ecosystem - EbroValley Digital
# Validates required environment variables are set and properly formatted

set -e

echo "🔍 Environment Variables Validation - Adaptive Learning Ecosystem"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${ENVIRONMENT:-development}
ENV_FILE=${ENV_FILE:-".env"}
STRICT_MODE=${STRICT_MODE:-false}

# Validation counters
ERRORS=0
WARNINGS=0
CHECKS=0

# Function to log validation results
log_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ((ERRORS++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    ((WARNINGS++))
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if variable is set and not empty
check_required() {
    local var_name=$1
    local var_value=${!var_name}
    local description=${2:-"$var_name"}
    
    ((CHECKS++))
    
    if [ -z "$var_value" ]; then
        log_error "$description is required but not set"
        return 1
    else
        log_success "$description is set"
        return 0
    fi
}

# Function to check if variable is set (optional but warn if missing)
check_optional() {
    local var_name=$1
    local var_value=${!var_name}
    local description=${2:-"$var_name"}
    
    ((CHECKS++))
    
    if [ -z "$var_value" ]; then
        log_warning "$description is not set (optional)"
        return 1
    else
        log_success "$description is set"
        return 0
    fi
}

# Function to validate URL format
validate_url() {
    local var_name=$1
    local var_value=${!var_name}
    local description=${2:-"$var_name"}
    
    if [ -n "$var_value" ]; then
        if [[ $var_value =~ ^https?:// ]]; then
            log_success "$description has valid URL format"
        else
            log_warning "$description should start with http:// or https://"
        fi
    fi
}

# Function to validate port number
validate_port() {
    local var_name=$1
    local var_value=${!var_name}
    local description=${2:-"$var_name"}
    
    if [ -n "$var_value" ]; then
        if [[ $var_value =~ ^[0-9]+$ ]] && [ "$var_value" -ge 1 ] && [ "$var_value" -le 65535 ]; then
            log_success "$description is a valid port number"
        else
            log_error "$description must be a number between 1 and 65535"
        fi
    fi
}

# Function to validate email format
validate_email() {
    local var_name=$1
    local var_value=${!var_name}
    local description=${2:-"$var_name"}
    
    if [ -n "$var_value" ]; then
        if [[ $var_value =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
            log_success "$description has valid email format"
        else
            log_error "$description must be a valid email address"
        fi
    fi
}

# Function to validate secret strength
validate_secret() {
    local var_name=$1
    local var_value=${!var_name}
    local description=${2:-"$var_name"}
    local min_length=${3:-32}
    
    if [ -n "$var_value" ]; then
        if [ ${#var_value} -ge $min_length ]; then
            log_success "$description meets minimum length requirement"
        else
            log_error "$description must be at least $min_length characters long"
        fi
    fi
}

# Function to check database connectivity
test_database_connection() {
    if [ -n "$DATABASE_URL" ]; then
        log_info "Testing database connection..."
        
        # Extract components from DATABASE_URL
        DB_TEST_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_TEST_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        
        if command -v nc >/dev/null 2>&1; then
            if nc -z "$DB_TEST_HOST" "$DB_TEST_PORT" 2>/dev/null; then
                log_success "Database host is reachable"
            else
                log_warning "Database host is not reachable (may be normal if DB is not running)"
            fi
        else
            log_info "netcat not available, skipping database connectivity test"
        fi
    fi
}

# Function to check Redis connectivity
test_redis_connection() {
    if [ -n "$REDIS_URL" ]; then
        log_info "Testing Redis connection..."
        
        # Extract components from REDIS_URL
        REDIS_TEST_HOST=$(echo "$REDIS_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        if [ -z "$REDIS_TEST_HOST" ]; then
            REDIS_TEST_HOST=$(echo "$REDIS_URL" | sed -n 's/redis:\/\/\([^:]*\):.*/\1/p')
        fi
        REDIS_TEST_PORT=$(echo "$REDIS_URL" | sed -n 's/.*:\([0-9]*\)$/\1/p')
        
        if command -v nc >/dev/null 2>&1; then
            if nc -z "$REDIS_TEST_HOST" "$REDIS_TEST_PORT" 2>/dev/null; then
                log_success "Redis host is reachable"
            else
                log_warning "Redis host is not reachable (may be normal if Redis is not running)"
            fi
        else
            log_info "netcat not available, skipping Redis connectivity test"
        fi
    fi
}

# Load environment file if it exists
load_env_file() {
    if [ -f "$ENV_FILE" ]; then
        log_info "Loading environment variables from $ENV_FILE"
        set -a
        source "$ENV_FILE"
        set +a
        log_success "Environment file loaded successfully"
    else
        log_warning "Environment file $ENV_FILE not found"
    fi
}

# Main validation function
main() {
    echo -e "${BLUE}🚀 Starting environment validation for: ${ENVIRONMENT}${NC}"
    echo ""
    
    # Load environment file
    load_env_file
    echo ""
    
    # ==========================================================================
    # CRITICAL REQUIRED VARIABLES
    # ==========================================================================
    
    echo -e "${YELLOW}🔑 Validating Critical Required Variables${NC}"
    echo "----------------------------------------"
    
    # Environment
    check_required "ENVIRONMENT" "Environment type"
    
    # Database
    check_required "DB_PASSWORD" "Database password"
    check_required "DATABASE_URL" "Database connection string"
    
    # Redis
    check_required "REDIS_PASSWORD" "Redis password"
    check_required "REDIS_URL" "Redis connection string"
    
    # JWT Secrets
    check_required "JWT_SECRET" "JWT secret key"
    check_required "JWT_REFRESH_SECRET" "JWT refresh secret key"
    
    # Validate secret strength
    validate_secret "JWT_SECRET" "JWT secret" 32
    validate_secret "JWT_REFRESH_SECRET" "JWT refresh secret" 32
    
    echo ""
    
    # ==========================================================================
    # AI/ML API KEYS
    # ==========================================================================
    
    echo -e "${YELLOW}🤖 Validating AI/ML API Keys${NC}"
    echo "----------------------------------------"
    
    # At least one AI API key should be set
    if [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
        log_error "At least one AI API key (OPENAI_API_KEY or ANTHROPIC_API_KEY) must be set"
    else
        if [ -n "$OPENAI_API_KEY" ]; then
            log_success "OpenAI API key is set"
            if [[ $OPENAI_API_KEY =~ ^sk- ]]; then
                log_success "OpenAI API key has correct format"
            else
                log_warning "OpenAI API key should start with 'sk-'"
            fi
        fi
        
        if [ -n "$ANTHROPIC_API_KEY" ]; then
            log_success "Anthropic API key is set"
            if [[ $ANTHROPIC_API_KEY =~ ^sk-ant- ]]; then
                log_success "Anthropic API key has correct format"
            else
                log_warning "Anthropic API key should start with 'sk-ant-'"
            fi
        fi
    fi
    
    echo ""
    
    # ==========================================================================
    # SERVICE PORTS
    # ==========================================================================
    
    echo -e "${YELLOW}🔌 Validating Service Ports${NC}"
    echo "----------------------------------------"
    
    validate_port "API_GATEWAY_PORT" "API Gateway port"
    validate_port "AI_TUTOR_PORT" "AI Tutor service port"
    validate_port "ASSESSMENT_PORT" "Assessment service port"
    validate_port "PROGRESS_TRACKING_PORT" "Progress tracking service port"
    validate_port "FRONTEND_PORT" "Frontend port"
    validate_port "DB_PORT" "Database port"
    validate_port "REDIS_PORT" "Redis port"
    
    echo ""
    
    # ==========================================================================
    # URL VALIDATION
    # ==========================================================================
    
    echo -e "${YELLOW}🌐 Validating URLs${NC}"
    echo "----------------------------------------"
    
    validate_url "FRONTEND_URL" "Frontend URL"
    validate_url "API_URL" "API URL"
    validate_url "QDRANT_URL" "Qdrant URL"
    
    echo ""
    
    # ==========================================================================
    # OPTIONAL BUT RECOMMENDED
    # ==========================================================================
    
    echo -e "${YELLOW}📧 Validating External Services (Optional)${NC}"
    echo "----------------------------------------"
    
    # Email configuration
    if [ -n "$SMTP_USER" ]; then
        validate_email "SMTP_USER" "SMTP user email"
        check_optional "SMTP_PASSWORD" "SMTP password"
        validate_port "SMTP_PORT" "SMTP port"
    fi
    
    # Monitoring
    if [ "$ENVIRONMENT" = "production" ]; then
        check_optional "GRAFANA_ADMIN_PASSWORD" "Grafana admin password"
        validate_secret "GRAFANA_ADMIN_PASSWORD" "Grafana admin password" 12
    fi
    
    echo ""
    
    # ==========================================================================
    # ENVIRONMENT SPECIFIC CHECKS
    # ==========================================================================
    
    echo -e "${YELLOW}🏗️  Environment-Specific Validation (${ENVIRONMENT})${NC}"
    echo "----------------------------------------"
    
    case "$ENVIRONMENT" in
        "production")
            check_required "DOMAIN" "Production domain"
            check_optional "SSL_CERT_PATH" "SSL certificate path"
            check_optional "SSL_KEY_PATH" "SSL private key path"
            check_optional "SENTRY_DSN" "Sentry error tracking DSN"
            
            # Production should not have debug features enabled
            if [ "$ENABLE_DEBUG_ROUTES" = "true" ]; then
                log_error "Debug routes should be disabled in production"
            fi
            if [ "$ENABLE_SWAGGER" = "true" ]; then
                log_warning "Swagger should typically be disabled in production"
            fi
            ;;
        "staging")
            check_optional "DOMAIN" "Staging domain"
            ;;
        "development")
            log_info "Development environment - relaxed validation"
            ;;
        *)
            log_warning "Unknown environment: $ENVIRONMENT"
            ;;
    esac
    
    echo ""
    
    # ==========================================================================
    # CONNECTIVITY TESTS
    # ==========================================================================
    
    echo -e "${YELLOW}🔗 Testing Connectivity${NC}"
    echo "----------------------------------------"
    
    test_database_connection
    test_redis_connection
    
    echo ""
    
    # ==========================================================================
    # SECURITY CHECKS
    # ==========================================================================
    
    echo -e "${YELLOW}🛡️  Security Validation${NC}"
    echo "----------------------------------------"
    
    # Check for default/weak passwords
    if [ "$DB_PASSWORD" = "your_secure_password_here" ]; then
        log_error "Database password is still set to default value"
    fi
    
    if [ "$REDIS_PASSWORD" = "your_redis_password_here" ]; then
        log_error "Redis password is still set to default value"
    fi
    
    if [ "$JWT_SECRET" = "your_super_secure_jwt_secret_at_least_32_characters_long" ]; then
        log_error "JWT secret is still set to default value"
    fi
    
    # Check CORS settings
    if [ "$CORS_ORIGIN" = "*" ] && [ "$ENVIRONMENT" = "production" ]; then
        log_error "CORS should not allow all origins (*) in production"
    fi
    
    echo ""
    
    # ==========================================================================
    # SUMMARY
    # ==========================================================================
    
    echo -e "${BLUE}📊 Validation Summary${NC}"
    echo "======================================"
    echo -e "Total checks: ${CHECKS}"
    echo -e "Errors: ${RED}${ERRORS}${NC}"
    echo -e "Warnings: ${YELLOW}${WARNINGS}${NC}"
    echo -e "Environment: ${ENVIRONMENT}"
    echo ""
    
    if [ $ERRORS -gt 0 ]; then
        echo -e "${RED}❌ Validation FAILED with $ERRORS errors${NC}"
        echo "Please fix the errors above before proceeding."
        exit 1
    elif [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Validation PASSED with $WARNINGS warnings${NC}"
        if [ "$STRICT_MODE" = "true" ]; then
            echo "Strict mode enabled: treating warnings as errors."
            exit 1
        else
            echo "Warnings detected but not blocking. Consider addressing them."
        fi
    else
        echo -e "${GREEN}✅ Validation PASSED successfully!${NC}"
        echo "All environment variables are properly configured."
    fi
    
    echo ""
    echo -e "${BLUE}🚀 Environment is ready for: ${ENVIRONMENT}${NC}"
}

# Handle script interruption
trap 'echo -e "\n${RED}Validation interrupted${NC}"; exit 1' INT TERM

# Show usage information
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --env-file FILE     Specify environment file (default: .env)"
    echo "  --environment ENV   Set environment type (development|staging|production)"
    echo "  --strict            Enable strict mode (warnings become errors)"
    echo "  --help              Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  ENV_FILE           Path to environment file"
    echo "  ENVIRONMENT        Environment type"
    echo "  STRICT_MODE        Enable strict mode (true|false)"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --strict)
            STRICT_MODE=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Run main validation
main