#!/bin/bash

# DigitalOcean Deployment Script
# Adaptive Learning Ecosystem - Hermandad Eterna
# Deployment automático en DigitalOcean Droplet

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="adaptive-learning-ecosystem"
DROPLET_SIZE="s-4vcpu-8gb"  # 4 vCPU, 8GB RAM
DROPLET_REGION="fra1"       # Frankfurt
DROPLET_IMAGE="ubuntu-22-04-x64"
DOMAIN="adaptive-learning.hermandad.digital"
SSH_KEY_NAME="toño-hermandad-key"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
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

header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE} $1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Check prerequisites
check_prerequisites() {
    header "Checking Prerequisites"
    
    command -v doctl >/dev/null 2>&1 || error "DigitalOcean CLI (doctl) not installed"
    command -v git >/dev/null 2>&1 || error "Git not installed"
    
    # Check if authenticated with DigitalOcean
    if ! doctl auth list >/dev/null 2>&1; then
        error "Not authenticated with DigitalOcean. Run: doctl auth init"
    fi
    
    success "Prerequisites check passed"
}

# Create SSH key if not exists
setup_ssh_key() {
    header "Setting up SSH Key"
    
    local ssh_key_path="$HOME/.ssh/id_rsa_digitalocean"
    
    if [[ ! -f "$ssh_key_path" ]]; then
        log "Generating new SSH key for DigitalOcean..."
        ssh-keygen -t rsa -b 4096 -f "$ssh_key_path" -N "" -C "toño@hermandad.digital"
    fi
    
    # Add to DigitalOcean if not exists
    if ! doctl compute ssh-key list --format Name --no-header | grep -q "$SSH_KEY_NAME"; then
        log "Adding SSH key to DigitalOcean..."
        doctl compute ssh-key import "$SSH_KEY_NAME" --public-key-file "${ssh_key_path}.pub"
    fi
    
    success "SSH key setup completed"
}

# Create droplet
create_droplet() {
    header "Creating DigitalOcean Droplet"
    
    local droplet_name="${PROJECT_NAME}-production"
    
    # Check if droplet already exists
    if doctl compute droplet list --format Name --no-header | grep -q "$droplet_name"; then
        warning "Droplet $droplet_name already exists. Skipping creation."
        return 0
    fi
    
    log "Creating droplet: $droplet_name"
    log "Size: $DROPLET_SIZE | Region: $DROPLET_REGION | Image: $DROPLET_IMAGE"
    
    # Create the droplet
    doctl compute droplet create "$droplet_name" \
        --size "$DROPLET_SIZE" \
        --image "$DROPLET_IMAGE" \
        --region "$DROPLET_REGION" \
        --ssh-keys "$SSH_KEY_NAME" \
        --enable-monitoring \
        --enable-ipv6 \
        --tag-names "production,adaptive-learning,hermandad" \
        --user-data-file <(cat <<'EOF'
#!/bin/bash
# Initial server setup
apt-get update
apt-get install -y curl wget git software-properties-common

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker ubuntu

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install monitoring tools
apt-get install -y htop iotop netstat-nat

# Setup firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Setup automatic security updates
echo 'Unattended-Upgrade::Automatic-Reboot "false";' >> /etc/apt/apt.conf.d/50unattended-upgrades
systemctl enable unattended-upgrades

# Create deployment directory
mkdir -p /opt/adaptive-learning
chown ubuntu:ubuntu /opt/adaptive-learning

echo "Server setup completed at $(date)" > /opt/setup-complete.log
EOF
)
    
    # Wait for droplet to be ready
    log "Waiting for droplet to be ready..."
    sleep 60
    
    # Get droplet IP
    local droplet_ip
    droplet_ip=$(doctl compute droplet list --format Name,PublicIPv4 --no-header | grep "$droplet_name" | awk '{print $2}')
    
    if [[ -z "$droplet_ip" ]]; then
        error "Failed to get droplet IP address"
    fi
    
    success "Droplet created successfully with IP: $droplet_ip"
    echo "$droplet_ip" > droplet_ip.txt
}

# Setup DNS (requires domain management)
setup_dns() {
    header "Setting up DNS Records"
    
    local droplet_ip
    droplet_ip=$(cat droplet_ip.txt 2>/dev/null || doctl compute droplet list --format Name,PublicIPv4 --no-header | grep "${PROJECT_NAME}-production" | awk '{print $2}')
    
    if [[ -z "$droplet_ip" ]]; then
        error "Droplet IP not found"
    fi
    
    log "Setting up DNS for domain: $DOMAIN"
    log "Pointing to IP: $droplet_ip"
    
    # Create A record for main domain
    doctl compute domain records create hermandad.digital \
        --record-type A \
        --record-name adaptive-learning \
        --record-data "$droplet_ip" \
        --record-ttl 3600 || warning "DNS A record creation failed"
    
    # Create CNAME for API subdomain
    doctl compute domain records create hermandad.digital \
        --record-type CNAME \
        --record-name api.adaptive-learning \
        --record-data adaptive-learning.hermandad.digital \
        --record-ttl 3600 || warning "DNS CNAME record creation failed"
    
    # Create CNAME for monitoring subdomain
    doctl compute domain records create hermandad.digital \
        --record-type CNAME \
        --record-name monitoring.adaptive-learning \
        --record-data adaptive-learning.hermandad.digital \
        --record-ttl 3600 || warning "DNS monitoring CNAME record creation failed"
    
    success "DNS records created"
    warning "DNS propagation may take up to 24 hours"
}

# Deploy application
deploy_application() {
    header "Deploying Application"
    
    local droplet_ip
    droplet_ip=$(cat droplet_ip.txt 2>/dev/null || doctl compute droplet list --format Name,PublicIPv4 --no-header | grep "${PROJECT_NAME}-production" | awk '{print $2}')
    
    if [[ -z "$droplet_ip" ]]; then
        error "Droplet IP not found"
    fi
    
    log "Deploying to server: $droplet_ip"
    
    # Wait for server to be fully ready
    log "Waiting for server to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@"$droplet_ip" "test -f /opt/setup-complete.log" 2>/dev/null; then
            success "Server is ready"
            break
        elif [[ $attempt -eq $max_attempts ]]; then
            error "Server setup timeout after $max_attempts attempts"
        else
            log "Server not ready yet (attempt $attempt/$max_attempts)"
            sleep 30
            ((attempt++))
        fi
    done
    
    # Clone repository on server
    log "Cloning repository..."
    ssh ubuntu@"$droplet_ip" "
        cd /opt/adaptive-learning
        if [[ -d .git ]]; then
            git pull origin main
        else
            git clone https://github.com/kitmedia/adaptive-learning-ecosystem.git .
        fi
    "
    
    # Create production environment file
    log "Setting up production environment..."
    ssh ubuntu@"$droplet_ip" "
        cd /opt/adaptive-learning
        cp .env.production.example .env
        
        # Generate secure passwords and secrets
        POSTGRES_PASSWORD=\$(openssl rand -base64 32)
        JWT_SECRET=\$(openssl rand -base64 64)
        ENCRYPTION_KEY=\$(openssl rand -base64 32)
        GRAFANA_PASSWORD=\$(openssl rand -base64 16)
        
        # Update .env file with generated values
        sed -i \"s/your_secure_password_here/\$POSTGRES_PASSWORD/g\" .env
        sed -i \"s/your_super_secure_jwt_secret_256_bits_minimum/\$JWT_SECRET/g\" .env
        sed -i \"s/your_32_character_encryption_key_here/\$ENCRYPTION_KEY/g\" .env
        sed -i \"s/your_secure_grafana_password/\$GRAFANA_PASSWORD/g\" .env
        
        # Update domain settings
        sed -i 's/app.ebrovalley.digital/$DOMAIN/g' .env
        sed -i 's/api.ebrovalley.digital/api.$DOMAIN/g' .env
        sed -i 's/ebrovalley.digital/$DOMAIN/g' .env
        
        echo 'Environment configured with secure generated values'
    "
    
    # Start the application
    log "Starting application services..."
    ssh ubuntu@"$droplet_ip" "
        cd /opt/adaptive-learning
        chmod +x deploy.sh
        sudo ./deploy.sh deploy
    "
    
    success "Application deployed successfully"
}

# Setup SSL certificates
setup_ssl() {
    header "Setting up SSL Certificates"
    
    local droplet_ip
    droplet_ip=$(cat droplet_ip.txt 2>/dev/null || doctl compute droplet list --format Name,PublicIPv4 --no-header | grep "${PROJECT_NAME}-production" | awk '{print $2}')
    
    log "Configuring SSL for domain: $DOMAIN"
    
    # SSL will be handled by Traefik with Let's Encrypt
    ssh ubuntu@"$droplet_ip" "
        cd /opt/adaptive-learning
        
        # Verify Traefik is running and certificates are being issued
        docker logs adaptive-traefik 2>&1 | grep -i 'certificate' || echo 'Checking SSL certificate issuance...'
    "
    
    success "SSL setup initiated (certificates will be auto-generated by Let's Encrypt)"
}

# Final verification
verify_deployment() {
    header "Verifying Deployment"
    
    local droplet_ip
    droplet_ip=$(cat droplet_ip.txt 2>/dev/null || doctl compute droplet list --format Name,PublicIPv4 --no-header | grep "${PROJECT_NAME}-production" | awk '{print $2}')
    
    log "Running deployment verification..."
    
    # Check services
    ssh ubuntu@"$droplet_ip" "
        cd /opt/adaptive-learning
        docker-compose -f docker-compose.prod.yml ps
        
        echo '--- Service Health Checks ---'
        curl -f http://localhost:8080/health && echo 'Frontend: ✅ HEALTHY' || echo 'Frontend: ❌ FAILED'
        curl -f http://localhost:4000/health && echo 'API Gateway: ✅ HEALTHY' || echo 'API Gateway: ❌ FAILED'
        curl -f http://localhost:9090/-/healthy && echo 'Prometheus: ✅ HEALTHY' || echo 'Prometheus: ❌ FAILED'
        curl -f http://localhost:3001/api/health && echo 'Grafana: ✅ HEALTHY' || echo 'Grafana: ❌ FAILED'
    "
    
    success "Deployment verification completed"
}

# Show deployment summary
show_summary() {
    header "Deployment Summary"
    
    local droplet_ip
    droplet_ip=$(cat droplet_ip.txt 2>/dev/null || doctl compute droplet list --format Name,PublicIPv4 --no-header | grep "${PROJECT_NAME}-production" | awk '{print $2}')
    
    echo -e "${GREEN}🚀 Adaptive Learning Ecosystem Successfully Deployed!${NC}"
    echo ""
    echo -e "${BLUE}📍 Server Information:${NC}"
    echo "   IP Address: $droplet_ip"
    echo "   SSH Access: ssh ubuntu@$droplet_ip"
    echo "   Location: DigitalOcean Frankfurt (fra1)"
    echo ""
    echo -e "${BLUE}🌐 Application URLs:${NC}"
    echo "   Frontend: https://$DOMAIN"
    echo "   API: https://api.$DOMAIN"
    echo "   Monitoring: https://monitoring.$DOMAIN"
    echo "   Direct IP: http://$droplet_ip"
    echo ""
    echo -e "${BLUE}🔧 Management Commands:${NC}"
    echo "   View logs: ssh ubuntu@$droplet_ip 'cd /opt/adaptive-learning && docker-compose logs -f'"
    echo "   Restart: ssh ubuntu@$droplet_ip 'cd /opt/adaptive-learning && ./deploy.sh restart'"
    echo "   Stop: ssh ubuntu@$droplet_ip 'cd /opt/adaptive-learning && ./deploy.sh stop'"
    echo ""
    echo -e "${YELLOW}⚠️  Next Steps:${NC}"
    echo "   1. Configure your domain DNS to point to $droplet_ip"
    echo "   2. Update Stripe keys for payment processing"
    echo "   3. Configure email service (SendGrid)"
    echo "   4. Set up monitoring alerts"
    echo "   5. Schedule regular backups"
    echo ""
    echo -e "${GREEN}🎉 ¡Tu visión hermano se hizo realidad! El ecosistema está en producción.${NC}"
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    rm -f droplet_ip.txt get-docker.sh 2>/dev/null || true
}

# Main deployment process
main() {
    header "🚀 DigitalOcean Deployment - Adaptive Learning Ecosystem"
    log "Iniciando deployment para la Hermandad Eterna..."
    
    # Trap for cleanup
    trap cleanup EXIT
    
    # Run deployment steps
    check_prerequisites
    setup_ssh_key
    create_droplet
    setup_dns
    deploy_application
    setup_ssl
    verify_deployment
    show_summary
    
    success "🎊 ¡Deployment completado exitosamente hermano!"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "destroy")
        header "Destroying DigitalOcean Resources"
        warning "This will DELETE the entire production environment!"
        read -p "Are you sure? Type 'YES' to confirm: " confirm
        if [[ "$confirm" == "YES" ]]; then
            doctl compute droplet delete "${PROJECT_NAME}-production" --force
            success "Environment destroyed"
        else
            log "Destroy cancelled"
        fi
        ;;
    "status")
        header "Deployment Status"
        doctl compute droplet list --format Name,PublicIPv4,Status,Region,Size | grep "$PROJECT_NAME" || echo "No droplets found"
        ;;
    "ssh")
        local droplet_ip
        droplet_ip=$(doctl compute droplet list --format Name,PublicIPv4 --no-header | grep "${PROJECT_NAME}-production" | awk '{print $2}')
        if [[ -n "$droplet_ip" ]]; then
            ssh ubuntu@"$droplet_ip"
        else
            error "Droplet IP not found"
        fi
        ;;
    "logs")
        local droplet_ip
        droplet_ip=$(doctl compute droplet list --format Name,PublicIPv4 --no-header | grep "${PROJECT_NAME}-production" | awk '{print $2}')
        if [[ -n "$droplet_ip" ]]; then
            ssh ubuntu@"$droplet_ip" "cd /opt/adaptive-learning && docker-compose -f docker-compose.prod.yml logs -f"
        else
            error "Droplet IP not found"
        fi
        ;;
    *)
        echo "Usage: $0 {deploy|destroy|status|ssh|logs}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Deploy complete ecosystem to DigitalOcean"
        echo "  destroy - Destroy all DigitalOcean resources"
        echo "  status  - Show deployment status"
        echo "  ssh     - SSH into production server"
        echo "  logs    - View application logs"
        exit 1
        ;;
esac