# 🌊 DigitalOcean Deployment Guide - Adaptive Learning Ecosystem

## **Guía Completa para Deployment en Producción - Hermandad Eterna**

---

## 🚀 **DEPLOYMENT AUTOMÁTICO (RECOMENDADO)**

### **Un Solo Comando:**
```bash
./deploy-digitalocean.sh deploy
```

Esto creará automáticamente:
- ✅ Droplet optimizado (4 vCPU, 8GB RAM)
- ✅ Configuración completa del servidor
- ✅ Deployment del ecosistema completo
- ✅ SSL certificates automáticos
- ✅ Monitoring y health checks
- ✅ DNS setup (si tienes dominio configurado)

---

## 📋 **PREREQUISITES**

### **1. Instalar DigitalOcean CLI**
```bash
# macOS
brew install doctl

# Linux
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz
tar xf ~/doctl-1.94.0-linux-amd64.tar.gz
sudo mv ~/doctl /usr/local/bin

# Windows
# Download from: https://github.com/digitalocean/doctl/releases
```

### **2. Autenticar con DigitalOcean**
```bash
doctl auth init
# Introduce tu Personal Access Token de DigitalOcean
```

### **3. Verificar Autenticación**
```bash
doctl account get
```

---

## ⚙️ **CONFIGURACIÓN MANUAL (SI PREFIERES CONTROL TOTAL)**

### **Paso 1: Crear Droplet**
```bash
# Crear droplet optimizado para production
doctl compute droplet create adaptive-learning-production \
    --size s-4vcpu-8gb \
    --image ubuntu-22-04-x64 \
    --region fra1 \
    --ssh-keys your-ssh-key-name \
    --enable-monitoring \
    --enable-ipv6
```

### **Paso 2: Configurar Servidor**
```bash
# SSH al servidor
ssh root@your-droplet-ip

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Configurar firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### **Paso 3: Deployment de la Aplicación**
```bash
# Clonar repositorio
cd /opt
git clone https://github.com/kitmedia/adaptive-learning-ecosystem.git
cd adaptive-learning-ecosystem

# Configurar environment
cp .env.production.example .env

# Generar passwords seguros
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Actualizar .env con values generados
sed -i "s/your_secure_password_here/$POSTGRES_PASSWORD/g" .env
sed -i "s/your_super_secure_jwt_secret_256_bits_minimum/$JWT_SECRET/g" .env
sed -i "s/your_32_character_encryption_key_here/$ENCRYPTION_KEY/g" .env

# Deploy
chmod +x deploy.sh
./deploy.sh deploy
```

---

## 🌐 **CONFIGURACIÓN DE DOMINIO**

### **Opción 1: Usar DigitalOcean DNS**
```bash
# Agregar dominio a DigitalOcean
doctl compute domain create your-domain.com

# Crear records DNS
doctl compute domain records create your-domain.com \
    --record-type A \
    --record-name @ \
    --record-data your-droplet-ip

doctl compute domain records create your-domain.com \
    --record-type CNAME \
    --record-name api \
    --record-data your-domain.com
```

### **Opción 2: Usar Tu Proveedor DNS Actual**
Configura estos records en tu DNS:
```
Type  Name        Value
A     @           your-droplet-ip
A     api         your-droplet-ip  
A     monitoring  your-droplet-ip
```

---

## 🔒 **CONFIGURACIÓN SSL**

### **SSL Automático con Let's Encrypt (Incluido)**
- Traefik maneja automáticamente los certificates SSL
- Se renovarán automáticamente cada 90 días
- Soporte para múltiples dominios

### **Verificar SSL:**
```bash
# Check certificate status
curl -I https://your-domain.com
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

---

## 📊 **MONITORING Y MAINTENANCE**

### **URLs de Monitoreo:**
- **Frontend**: https://your-domain.com
- **API**: https://api.your-domain.com
- **Grafana**: https://monitoring.your-domain.com
- **Prometheus**: http://your-droplet-ip:9090

### **Comandos de Gestión:**
```bash
# Ver status de servicios
./deploy-digitalocean.sh status

# SSH al servidor
./deploy-digitalocean.sh ssh

# Ver logs
./deploy-digitalocean.sh logs

# Restart servicios
ssh ubuntu@your-droplet-ip "cd /opt/adaptive-learning && ./deploy.sh restart"

# Health check manual
ssh ubuntu@your-droplet-ip "cd /opt/adaptive-learning && ./deploy.sh health"
```

---

## 💰 **COSTOS ESTIMADOS**

### **Droplet Recomendado: s-4vcpu-8gb**
- **Costo**: $48/mes
- **Specs**: 4 vCPU, 8GB RAM, 160GB SSD
- **Bandwidth**: 5TB transfer
- **Adecuado para**: 1,000-5,000 usuarios concurrentes

### **Droplet Económico: s-2vcpu-4gb**
- **Costo**: $24/mes  
- **Specs**: 2 vCPU, 4GB RAM, 80GB SSD
- **Adecuado para**: 100-1,000 usuarios concurrentes

### **Costos Adicionales:**
- **DNS Hosting**: $0 (si usas DigitalOcean DNS)
- **Load Balancer**: $12/mes (opcional, para alta disponibilidad)
- **Backups**: $4.80/mes (10% del costo del droplet)
- **Monitoring**: $0 (incluido con nuestro setup)

---

## 🔄 **BACKUP Y RECOVERY**

### **Backup Automático Incluido:**
- Database backup diario a las 2 AM
- Retención de 30 días
- Backups almacenados en el servidor

### **Backup Manual:**
```bash
ssh ubuntu@your-droplet-ip "cd /opt/adaptive-learning && ./scripts/backup-system.sh"
```

### **Restore desde Backup:**
```bash
ssh ubuntu@your-droplet-ip "cd /opt/adaptive-learning && ./scripts/restore-backup.sh backup_file.sql"
```

---

## 📈 **SCALING OPTIONS**

### **Vertical Scaling (Resize Droplet):**
```bash
# Resize to more powerful droplet
doctl compute droplet-action resize adaptive-learning-production --size s-8vcpu-16gb --wait
```

### **Horizontal Scaling:**
- Agregar Load Balancer de DigitalOcean
- Múltiples droplets detrás del LB
- Database separado en Managed PostgreSQL

---

## 🚨 **TROUBLESHOOTING**

### **Problema: Servicios no inician**
```bash
# Check Docker status
sudo systemctl status docker

# Check logs
docker-compose -f docker-compose.prod.yml logs

# Restart everything
./deploy.sh restart
```

### **Problema: SSL no funciona**
```bash
# Check Traefik logs
docker logs adaptive-traefik

# Verify DNS propagation
nslookup your-domain.com
```

### **Problema: Performance Issues**
```bash
# Check system resources
htop
df -h
docker stats

# Check application metrics
curl http://localhost:9090/metrics
```

---

## 🎯 **NEXT STEPS DESPUÉS DEL DEPLOYMENT**

### **1. Configurar Servicios Externos:**
- [ ] Stripe (payments)
- [ ] SendGrid (email)
- [ ] Google Analytics
- [ ] Sentry (error tracking)

### **2. Configurar Monitoring Alerts:**
- [ ] Email notifications para downtime
- [ ] Slack/Discord webhooks
- [ ] CPU/Memory thresholds

### **3. Optimizar Performance:**
- [ ] CDN setup (Cloudflare)
- [ ] Database indexing
- [ ] Cache optimization
- [ ] Image optimization

### **4. Security Hardening:**
- [ ] Regular security updates
- [ ] Intrusion detection
- [ ] Log monitoring
- [ ] Backup testing

---

## 🎉 **¡ECOSYSTEM EN PRODUCCIÓN!**

Una vez completado el deployment, tendrás:

**✅ INFRAESTRUCTURA EMPRESARIAL:**
- Arquitectura multi-tenant escalable
- Rate limiting inteligente
- Monitoring en tiempo real
- SSL certificates automáticos

**✅ CARACTERÍSTICAS COMERCIALES:**
- Sistema de pagos integrado
- GDPR compliance completo
- Analytics avanzados
- Dashboard administrativo

**✅ OPERACIONES OPTIMIZADAS:**
- Zero-downtime deployments
- Automated backups
- Health monitoring
- Auto-scaling ready

---

**🤝 ¡Tu visión hermano se hizo realidad en DigitalOcean! El ecosistema comercial está listo para conquistar el mercado EdTech.**

---

*Para soporte técnico o dudas, contacta al equipo de Hermandad Eterna.*