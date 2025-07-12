#!/bin/bash

# Environment Setup Script
# Adaptive Learning Ecosystem - EbroValley Digital
# Automated environment configuration

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
ENVIRONMENTS=("development" "staging" "production")

# Functions
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Show usage
show_usage() {
    cat << EOF
Environment Setup Script - Adaptive Learning Ecosystem

Usage: $0 [ENVIRONMENT] [OPTIONS]

ENVIRONMENTS:
  development    Setup local development environment
  staging        Setup staging environment  
  production     Setup production environment
  all            Setup all environments

OPTIONS:
  --force        Overwrite existing .env files
  --secrets      Generate secure secrets automatically
  --validate     Only validate existing configuration
  --interactive  Interactive setup with prompts
  --help         Show this help message

EXAMPLES:
  $0 development
  $0 staging --secrets
  $0 production --interactive
  $0 all --force

EOF
}

# Generate secure random string
generate_secret() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Generate JWT secret
generate_jwt_secret() {
    openssl rand -base64 64 | tr -d "=+/" | cut -c1-64
}

# Generate encryption key
generate_encryption_key() {
    openssl rand -hex 16
}

# Validate environment file
validate_env_file() {
    local env_file="$1"
    local environment="$2"
    
    log "Validating $env_file..."
    
    if [[ ! -f "$env_file" ]]; then
        error "Environment file $env_file not found"
    fi
    
    # Required variables for all environments
    local required_vars=(
        "NODE_ENV"
        "APP_NAME"
        "POSTGRES_PASSWORD"
        "JWT_SECRET"
    )
    
    # Production-specific required variables
    if [[ "$environment" == "production" ]]; then
        required_vars+=(
            "STRIPE_SECRET_KEY"
            "CLOUDFLARE_API_KEY"
            "SENTRY_DSN"
        )
    fi
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$env_file" && ! grep -q "^$var=" "$env_file"; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        error "Missing required variables: ${missing_vars[*]}"
    fi
    
    # Check for placeholder values that need to be replaced
    local placeholder_patterns=(
        "your_secure_password_here"
        "your_super_secure_jwt_secret"
        "replace_me"
        "changeme"
        "your_.*_key"
    )
    
    for pattern in "${placeholder_patterns[@]}"; do
        if grep -q "$pattern" "$env_file"; then
            warning "Found placeholder values that should be replaced: $pattern"
        fi
    done
    
    success "Environment file $env_file validation passed"
}

# Setup development environment
setup_development() {
    log "Setting up development environment..."
    
    local env_file="$PROJECT_ROOT/.env"
    local example_file="$PROJECT_ROOT/.env.development.example"
    
    if [[ -f "$env_file" ]] && [[ "$FORCE" != "true" ]]; then
        warning ".env file already exists. Use --force to overwrite"
        return 0
    fi
    
    if [[ ! -f "$example_file" ]]; then
        error "Development example file not found: $example_file"
    fi
    
    # Copy example file
    cp "$example_file" "$env_file"
    
    if [[ "$GENERATE_SECRETS" == "true" ]]; then
        log "Generating development secrets..."
        
        # Generate secure but predictable dev secrets
        sed -i "s/dev_password_123/dev_$(generate_secret 16)/g" "$env_file"
        sed -i "s/dev_jwt_secret_not_for_production_123456789/dev_$(generate_jwt_secret)/g" "$env_file"
        sed -i "s/dev_encryption_key_32_characters/dev_$(generate_encryption_key)/g" "$env_file"
    fi
    
    success "Development environment configured"
    log "Configuration file: $env_file"
}

# Setup staging environment
setup_staging() {
    log "Setting up staging environment..."
    
    local env_file="$PROJECT_ROOT/.env.staging"
    local example_file="$PROJECT_ROOT/.env.staging.example"
    
    if [[ -f "$env_file" ]] && [[ "$FORCE" != "true" ]]; then
        warning ".env.staging file already exists. Use --force to overwrite"
        return 0
    fi
    
    if [[ ! -f "$example_file" ]]; then
        error "Staging example file not found: $example_file"
    fi
    
    # Copy example file
    cp "$example_file" "$env_file"
    
    if [[ "$GENERATE_SECRETS" == "true" ]]; then
        log "Generating staging secrets..."
        
        # Generate secure secrets
        sed -i "s/staging_secure_password_replace_me/$(generate_secret 32)/g" "$env_file"
        sed -i "s/staging_jwt_secret_256_bits_minimum_replace_me/$(generate_jwt_secret)/g" "$env_file"
        sed -i "s/staging_32_character_encryption_key/$(generate_encryption_key)/g" "$env_file"
        sed -i "s/staging_redis_password/$(generate_secret 24)/g" "$env_file"
        sed -i "s/staging_grafana_password/$(generate_secret 16)/g" "$env_file"
    fi
    
    success "Staging environment configured"
    log "Configuration file: $env_file"
    warning "Remember to configure external service API keys"
}

# Setup production environment
setup_production() {
    log "Setting up production environment..."
    
    local env_file="$PROJECT_ROOT/.env.production"
    local example_file="$PROJECT_ROOT/.env.production.example"
    
    if [[ -f "$env_file" ]] && [[ "$FORCE" != "true" ]]; then
        warning ".env.production file already exists. Use --force to overwrite"
        return 0
    fi
    
    if [[ ! -f "$example_file" ]]; then
        error "Production example file not found: $example_file"
    fi
    
    # Copy example file
    cp "$example_file" "$env_file"
    
    if [[ "$GENERATE_SECRETS" == "true" ]]; then
        log "Generating production secrets..."
        
        # Generate ultra-secure secrets
        sed -i "s/your_secure_password_here/$(generate_secret 64)/g" "$env_file"
        sed -i "s/your_super_secure_jwt_secret_256_bits_minimum/$(generate_jwt_secret)/g" "$env_file"
        sed -i "s/your_32_character_encryption_key_here/$(generate_encryption_key)/g" "$env_file"
        sed -i "s/your_secure_grafana_password/$(generate_secret 32)/g" "$env_file"
    fi
    
    success "Production environment configured"
    log "Configuration file: $env_file"
    warning "⚠️  IMPORTANT: Configure all external service API keys before deployment"
    warning "⚠️  NEVER commit the .env.production file to version control"
}

# Interactive setup
interactive_setup() {
    local environment="$1"
    
    log "Starting interactive setup for $environment environment..."
    
    echo
    echo "This will guide you through configuring your $environment environment."
    echo "Press Enter to use default values, or enter custom values."
    echo
    
    # Basic configuration
    read -p "Application name [Adaptive Learning Ecosystem]: " app_name
    app_name=${app_name:-"Adaptive Learning Ecosystem"}
    
    read -p "Domain name [localhost]: " domain
    domain=${domain:-"localhost"}
    
    # Database configuration
    echo
    echo "Database Configuration:"
    read -p "Database name [adaptive_learning_${environment}]: " db_name
    db_name=${db_name:-"adaptive_learning_${environment}"}
    
    read -p "Database user [postgres]: " db_user
    db_user=${db_user:-"postgres"}
    
    read -s -p "Database password: " db_password
    echo
    
    if [[ -z "$db_password" ]]; then
        db_password=$(generate_secret 32)
        log "Generated secure database password"
    fi
    
    # JWT Configuration
    echo
    echo "Security Configuration:"
    read -p "Generate JWT secret automatically? [Y/n]: " generate_jwt
    
    if [[ "$generate_jwt" =~ ^[Nn]$ ]]; then
        read -s -p "JWT secret: " jwt_secret
        echo
    else
        jwt_secret=$(generate_jwt_secret)
        log "Generated secure JWT secret"
    fi
    
    # Save configuration
    local env_file="$PROJECT_ROOT/.env"
    if [[ "$environment" != "development" ]]; then
        env_file="$PROJECT_ROOT/.env.$environment"
    fi
    
    local example_file="$PROJECT_ROOT/.env.$environment.example"
    cp "$example_file" "$env_file"
    
    # Apply custom values
    sed -i "s/APP_NAME=.*/APP_NAME=\"$app_name\"/" "$env_file"
    sed -i "s/APP_DOMAIN=.*/APP_DOMAIN=$domain/" "$env_file"
    sed -i "s/POSTGRES_DB=.*/POSTGRES_DB=$db_name/" "$env_file"
    sed -i "s/POSTGRES_USER=.*/POSTGRES_USER=$db_user/" "$env_file"
    sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$db_password/" "$env_file"
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$jwt_secret/" "$env_file"
    
    success "Interactive setup completed for $environment"
    log "Configuration saved to: $env_file"
}

# Create Docker environment files
create_docker_env() {
    log "Creating Docker environment files..."
    
    for env in "${ENVIRONMENTS[@]}"; do
        local env_file="$PROJECT_ROOT/.env.$env"
        local docker_env_file="$PROJECT_ROOT/.env.docker.$env"
        
        if [[ -f "$env_file" ]]; then
            # Create Docker-specific environment file
            cp "$env_file" "$docker_env_file"
            
            # Adjust hostnames for Docker containers
            sed -i "s/localhost/postgres/g" "$docker_env_file" || true
            sed -i "s/127.0.0.1/postgres/g" "$docker_env_file" || true
            
            success "Created Docker environment file: $docker_env_file"
        fi
    done
}

# Main setup function
main() {
    local environment="${1:-}"
    
    # Parse command line arguments
    FORCE="false"
    GENERATE_SECRETS="false"
    VALIDATE_ONLY="false"
    INTERACTIVE="false"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                FORCE="true"
                shift
                ;;
            --secrets)
                GENERATE_SECRETS="true"
                shift
                ;;
            --validate)
                VALIDATE_ONLY="true"
                shift
                ;;
            --interactive)
                INTERACTIVE="true"
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            development|staging|production|all)
                if [[ -z "$environment" ]]; then
                    environment="$1"
                fi
                shift
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
    
    if [[ -z "$environment" ]]; then
        show_usage
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
    
    log "🚀 Environment Setup - Adaptive Learning Ecosystem"
    log "=================================================="
    
    # Validation only mode
    if [[ "$VALIDATE_ONLY" == "true" ]]; then
        log "Running validation mode..."
        
        if [[ "$environment" == "all" ]]; then
            for env in "${ENVIRONMENTS[@]}"; do
                env_file=".env.$env"
                if [[ "$env" == "development" ]]; then
                    env_file=".env"
                fi
                
                if [[ -f "$env_file" ]]; then
                    validate_env_file "$env_file" "$env"
                else
                    warning "Environment file $env_file not found"
                fi
            done
        else
            env_file=".env.$environment"
            if [[ "$environment" == "development" ]]; then
                env_file=".env"
            fi
            
            validate_env_file "$env_file" "$environment"
        fi
        
        success "Validation completed"
        exit 0
    fi
    
    # Setup environments
    case "$environment" in
        "development")
            if [[ "$INTERACTIVE" == "true" ]]; then
                interactive_setup "development"
            else
                setup_development
            fi
            ;;
        "staging")
            if [[ "$INTERACTIVE" == "true" ]]; then
                interactive_setup "staging"
            else
                setup_staging
            fi
            ;;
        "production")
            if [[ "$INTERACTIVE" == "true" ]]; then
                interactive_setup "production"
            else
                setup_production
            fi
            ;;
        "all")
            setup_development
            setup_staging
            setup_production
            ;;
        *)
            error "Invalid environment: $environment"
            ;;
    esac
    
    # Create Docker environment files
    create_docker_env
    
    # Final validation
    log "Running final validation..."
    
    if [[ "$environment" == "all" ]]; then
        for env in "${ENVIRONMENTS[@]}"; do
            env_file=".env.$env"
            if [[ "$env" == "development" ]]; then
                env_file=".env"
            fi
            
            if [[ -f "$env_file" ]]; then
                validate_env_file "$env_file" "$env"
            fi
        done
    else
        env_file=".env.$environment"
        if [[ "$environment" == "development" ]]; then
            env_file=".env"
        fi
        
        validate_env_file "$env_file" "$environment"
    fi
    
    log "=================================================="
    success "🎉 Environment setup completed successfully!"
    log ""
    log "Next steps:"
    log "1. Review the generated configuration files"
    log "2. Configure external service API keys"
    log "3. Run: docker-compose up -d"
    log "4. Access the application at the configured domain"
    log ""
    warning "⚠️  Remember to:"
    warning "   - Never commit .env files to version control"
    warning "   - Use strong, unique passwords in production"
    warning "   - Regularly rotate secrets and API keys"
}

# Check if running directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi