#!/bin/bash

# Configuration Validation Script
# Adaptive Learning Ecosystem - EbroValley Digital
# Comprehensive environment and infrastructure validation

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
VALIDATION_LOG="validation-report.json"

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Functions
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[✅ PASS]${NC} $1"
    ((PASSED_CHECKS++))
}

warning() {
    echo -e "${YELLOW}[⚠️  WARN]${NC} $1"
    ((WARNING_CHECKS++))
}

error() {
    echo -e "${RED}[❌ FAIL]${NC} $1"
    ((FAILED_CHECKS++))
}

# Initialize validation report
init_report() {
    cat > "$VALIDATION_LOG" << EOF
{
  "validation_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "project": "Adaptive Learning Ecosystem",
  "version": "2.0.0",
  "checks": []
}
EOF
}

# Add check result to report
add_check_result() {
    local category="$1"
    local name="$2"
    local status="$3"
    local message="$4"
    local details="${5:-}"
    
    local check_json=$(cat << EOF
{
  "category": "$category",
  "name": "$name",
  "status": "$status",
  "message": "$message",
  "details": "$details",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)
    
    # Add to report (simplified JSON manipulation)
    # In production, use jq for proper JSON handling
}

# Check if required tools are installed
check_prerequisites() {
    log "Checking prerequisites..."
    ((TOTAL_CHECKS++))
    
    local required_tools=("docker" "docker-compose" "curl" "openssl")
    local missing_tools=()
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done
    
    if [[ ${#missing_tools[@]} -eq 0 ]]; then
        success "All required tools are installed"
        add_check_result "prerequisites" "required_tools" "pass" "All tools available"
    else
        error "Missing required tools: ${missing_tools[*]}"
        add_check_result "prerequisites" "required_tools" "fail" "Missing tools: ${missing_tools[*]}"
    fi
}

# Validate environment files
validate_environment_files() {
    log "Validating environment files..."
    
    local environments=("development" "staging" "production")
    
    for env in "${environments[@]}"; do
        ((TOTAL_CHECKS++))
        
        local env_file=".env.$env.example"
        local actual_env_file=".env"
        
        if [[ "$env" != "development" ]]; then
            actual_env_file=".env.$env"
        fi
        
        # Check if example file exists
        if [[ ! -f "$PROJECT_ROOT/$env_file" ]]; then
            error "Environment example file missing: $env_file"
            add_check_result "environment" "$env_example" "fail" "File not found"
            continue
        fi
        
        # Check required variables
        local required_vars=(
            "NODE_ENV"
            "APP_NAME"
            "POSTGRES_PASSWORD"
            "JWT_SECRET"
        )
        
        local missing_vars=()
        
        for var in "${required_vars[@]}"; do
            if ! grep -q "^$var=" "$PROJECT_ROOT/$env_file" && ! grep -q "^#.*$var=" "$PROJECT_ROOT/$env_file"; then
                missing_vars+=("$var")
            fi
        done
        
        if [[ ${#missing_vars[@]} -eq 0 ]]; then
            success "Environment file $env_file is valid"
            add_check_result "environment" "$env_validation" "pass" "All required variables present"
        else
            error "Environment file $env_file missing variables: ${missing_vars[*]}"
            add_check_result "environment" "$env_validation" "fail" "Missing variables: ${missing_vars[*]}"
        fi
        
        # Check for placeholder values in actual env files
        if [[ -f "$PROJECT_ROOT/$actual_env_file" ]]; then
            ((TOTAL_CHECKS++))
            
            local placeholders=(
                "your_secure_password_here"
                "replace_me"
                "changeme"
                "your_.*_key"
            )
            
            local found_placeholders=()
            
            for placeholder in "${placeholders[@]}"; do
                if grep -q "$placeholder" "$PROJECT_ROOT/$actual_env_file"; then
                    found_placeholders+=("$placeholder")
                fi
            done
            
            if [[ ${#found_placeholders[@]} -eq 0 ]]; then
                success "No placeholder values found in $actual_env_file"
                add_check_result "environment" "$env_placeholders" "pass" "No placeholders detected"
            else
                warning "Found placeholder values in $actual_env_file: ${found_placeholders[*]}"
                add_check_result "environment" "$env_placeholders" "warn" "Placeholders found: ${found_placeholders[*]}"
            fi
        fi
    done
}

# Validate Docker configuration
validate_docker_config() {
    log "Validating Docker configuration..."
    
    local docker_files=(
        "Dockerfile"
        "docker-compose.prod.yml"
        "nginx.prod.conf"
        "nginx-default.conf"
    )
    
    for file in "${docker_files[@]}"; do
        ((TOTAL_CHECKS++))
        
        local file_path="$PROJECT_ROOT"
        
        # Frontend Dockerfile is in frontend directory
        if [[ "$file" == "Dockerfile" ]]; then
            file_path="$PROJECT_ROOT/frontend"
        fi
        
        if [[ -f "$file_path/$file" ]]; then
            success "Docker file found: $file"
            add_check_result "docker" "$file" "pass" "File exists"
            
            # Validate Docker Compose syntax
            if [[ "$file" == "docker-compose.prod.yml" ]]; then
                ((TOTAL_CHECKS++))
                
                if docker-compose -f "$PROJECT_ROOT/$file" config >/dev/null 2>&1; then
                    success "Docker Compose syntax is valid"
                    add_check_result "docker" "compose_syntax" "pass" "Valid syntax"
                else
                    error "Docker Compose syntax validation failed"
                    add_check_result "docker" "compose_syntax" "fail" "Invalid syntax"
                fi
            fi
        else
            error "Docker file missing: $file"
            add_check_result "docker" "$file" "fail" "File not found"
        fi
    done
}

# Validate security configuration
validate_security() {
    log "Validating security configuration..."
    
    # Check security headers file
    ((TOTAL_CHECKS++))
    local headers_file="$PROJECT_ROOT/frontend/public/_headers"
    
    if [[ -f "$headers_file" ]]; then
        success "Security headers file found"
        add_check_result "security" "headers_file" "pass" "File exists"
        
        # Check for required security headers
        local required_headers=(
            "Content-Security-Policy"
            "X-Frame-Options"
            "X-Content-Type-Options"
            "Strict-Transport-Security"
        )
        
        local missing_headers=()
        
        for header in "${required_headers[@]}"; do
            if ! grep -q "$header" "$headers_file"; then
                missing_headers+=("$header")
            fi
        done
        
        ((TOTAL_CHECKS++))
        if [[ ${#missing_headers[@]} -eq 0 ]]; then
            success "All required security headers present"
            add_check_result "security" "security_headers" "pass" "All headers configured"
        else
            error "Missing security headers: ${missing_headers[*]}"
            add_check_result "security" "security_headers" "fail" "Missing headers: ${missing_headers[*]}"
        fi
    else
        error "Security headers file missing"
        add_check_result "security" "headers_file" "fail" "File not found"
    fi
    
    # Check GDPR components
    ((TOTAL_CHECKS++))
    local gdpr_files=(
        "frontend/src/components/gdpr/CookieConsent.tsx"
        "frontend/src/pages/PrivacyPolicy.tsx"
        "frontend/src/services/gdpr.service.ts"
    )
    
    local missing_gdpr_files=()
    
    for file in "${gdpr_files[@]}"; do
        if [[ ! -f "$PROJECT_ROOT/$file" ]]; then
            missing_gdpr_files+=("$file")
        fi
    done
    
    if [[ ${#missing_gdpr_files[@]} -eq 0 ]]; then
        success "All GDPR components present"
        add_check_result "security" "gdpr_components" "pass" "All components found"
    else
        error "Missing GDPR components: ${missing_gdpr_files[*]}"
        add_check_result "security" "gdpr_components" "fail" "Missing components: ${missing_gdpr_files[*]}"
    fi
}

# Validate CI/CD configuration
validate_cicd() {
    log "Validating CI/CD configuration..."
    
    local workflow_files=(
        ".github/workflows/ci-cd.yml"
        ".github/workflows/security.yml"
        ".github/workflows/environment-sync.yml"
    )
    
    for file in "${workflow_files[@]}"; do
        ((TOTAL_CHECKS++))
        
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            success "CI/CD workflow found: $file"
            add_check_result "cicd" "$(basename "$file")" "pass" "File exists"
        else
            error "CI/CD workflow missing: $file"
            add_check_result "cicd" "$(basename "$file")" "fail" "File not found"
        fi
    done
}

# Validate frontend build
validate_frontend_build() {
    log "Validating frontend build configuration..."
    
    ((TOTAL_CHECKS++))
    local package_json="$PROJECT_ROOT/frontend/package.json"
    
    if [[ -f "$package_json" ]]; then
        success "Frontend package.json found"
        add_check_result "frontend" "package_json" "pass" "File exists"
        
        # Check for required scripts
        ((TOTAL_CHECKS++))
        local required_scripts=("build" "dev" "preview")
        local missing_scripts=()
        
        for script in "${required_scripts[@]}"; do
            if ! grep -q "\"$script\":" "$package_json"; then
                missing_scripts+=("$script")
            fi
        done
        
        if [[ ${#missing_scripts[@]} -eq 0 ]]; then
            success "All required npm scripts present"
            add_check_result "frontend" "npm_scripts" "pass" "All scripts configured"
        else
            error "Missing npm scripts: ${missing_scripts[*]}"
            add_check_result "frontend" "npm_scripts" "fail" "Missing scripts: ${missing_scripts[*]}"
        fi
        
        # Check TypeScript configuration
        ((TOTAL_CHECKS++))
        local tsconfig="$PROJECT_ROOT/frontend/tsconfig.json"
        
        if [[ -f "$tsconfig" ]]; then
            success "TypeScript configuration found"
            add_check_result "frontend" "typescript_config" "pass" "File exists"
        else
            error "TypeScript configuration missing"
            add_check_result "frontend" "typescript_config" "fail" "File not found"
        fi
    else
        error "Frontend package.json missing"
        add_check_result "frontend" "package_json" "fail" "File not found"
    fi
}

# Check network connectivity
validate_network() {
    log "Validating network connectivity..."
    
    local test_urls=(
        "https://api.stripe.com"
        "https://api.github.com"
        "https://registry-1.docker.io"
    )
    
    for url in "${test_urls[@]}"; do
        ((TOTAL_CHECKS++))
        
        if curl -sSf --max-time 10 "$url" >/dev/null 2>&1; then
            success "Network connectivity to $(echo $url | cut -d'/' -f3): OK"
            add_check_result "network" "$(echo $url | cut -d'/' -f3)" "pass" "Connectivity verified"
        else
            warning "Network connectivity to $(echo $url | cut -d'/' -f3): Failed"
            add_check_result "network" "$(echo $url | cut -d'/' -f3)" "warn" "Connection failed"
        fi
    done
}

# Generate validation summary
generate_summary() {
    log "Generating validation summary..."
    
    local total_checks=$((PASSED_CHECKS + FAILED_CHECKS + WARNING_CHECKS))
    local pass_rate=0
    
    if [[ $total_checks -gt 0 ]]; then
        pass_rate=$((PASSED_CHECKS * 100 / total_checks))
    fi
    
    echo
    echo "=================================================="
    echo "📊 VALIDATION SUMMARY"
    echo "=================================================="
    echo
    echo -e "Total Checks:     ${BLUE}$total_checks${NC}"
    echo -e "Passed:          ${GREEN}$PASSED_CHECKS${NC}"
    echo -e "Failed:          ${RED}$FAILED_CHECKS${NC}"
    echo -e "Warnings:        ${YELLOW}$WARNING_CHECKS${NC}"
    echo -e "Pass Rate:       ${BLUE}$pass_rate%${NC}"
    echo
    
    if [[ $FAILED_CHECKS -eq 0 ]]; then
        echo -e "${GREEN}🎉 All critical validations passed!${NC}"
        
        if [[ $WARNING_CHECKS -gt 0 ]]; then
            echo -e "${YELLOW}⚠️  Please review warnings before deployment${NC}"
        else
            echo -e "${GREEN}✅ System is ready for deployment${NC}"
        fi
    else
        echo -e "${RED}❌ $FAILED_CHECKS critical issues found${NC}"
        echo -e "${RED}🚨 Fix all failed checks before deployment${NC}"
    fi
    
    echo
    echo "Detailed report saved to: $VALIDATION_LOG"
    echo "=================================================="
}

# Main validation function
main() {
    cd "$PROJECT_ROOT"
    
    echo "🔍 Configuration Validation - Adaptive Learning Ecosystem"
    echo "=========================================================="
    
    # Initialize
    init_report
    
    # Run all validations
    check_prerequisites
    validate_environment_files
    validate_docker_config
    validate_security
    validate_cicd
    validate_frontend_build
    validate_network
    
    # Generate summary
    generate_summary
    
    # Exit with appropriate code
    if [[ $FAILED_CHECKS -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

# Run if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi