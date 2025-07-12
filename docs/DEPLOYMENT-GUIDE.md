# 🚀 DEPLOYMENT GUIDE - ADAPTIVE LEARNING ECOSYSTEM

## 📊 Overview

Esta guía completa cubre todos los aspectos del despliegue del Adaptive Learning Ecosystem, desde desarrollo local hasta producción empresarial. El sistema está diseñado para ser desplegado en diferentes entornos usando Docker y orquestación.

**Arquitectura**: Microservicios dockerizados  
**Orquestación**: Docker Compose / Kubernetes  
**Infraestructura**: Cloud-native ready

---

## 📫 Tabla de Contenidos

1. [Prerequisitos](#-prerequisitos)
2. [Desarrollo Local](#-desarrollo-local)
3. [Staging Environment](#-staging-environment)
4. [Producción](#-producción)
5. [Monitoreo](#-monitoreo)
6. [Troubleshooting](#-troubleshooting)
7. [Backup y Recovery](#-backup-y-recovery)

---

## 🛠️ Prerequisitos

### Herramientas Requeridas

```bash
# 1. Docker Engine 24.x+
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# 2. Docker Compose v2.21+
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Node.js 20.x (para builds locales)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Python 3.11+ (para servicios Python)
sudo apt install python3.11 python3.11-pip python3.11-venv

# 5. Git
sudo apt install git
```

### Verificación de Instalación
```bash
# Verificar versiones
docker --version          # >= 24.0
docker-compose --version  # >= 2.21
node --version            # >= 20.0
python3 --version         # >= 3.11
git --version            # >= 2.30
```

### Hardware Mínimo

| Entorno | CPU | RAM | Disco | Descripción |
|---------|-----|-----|-------|-------------|
| **Desarrollo** | 4 cores | 8GB | 50GB SSD | Laptop/Desktop |
| **Staging** | 8 cores | 16GB | 100GB SSD | VPS/Cloud |
| **Producción** | 16+ cores | 32GB+ | 500GB+ SSD | Cluster/Cloud |

---

## 💻 Desarrollo Local

### Setup Inicial

```bash
# 1. Clonar repositorio
git clone <repository-url>
cd adaptive-learning-ecosystem

# 2. Configurar variables de entorno
cp .env.example .env.development
# Editar .env.development con configuración local

# 3. Construir imágenes
docker-compose build

# 4. Iniciar servicios
./scripts/dev-up.sh
```

### Configuración de Desarrollo

**Archivo**: `.env.development`
```bash
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=adaptive_learning_dev
POSTGRES_USER=dev_user
POSTGRES_PASSWORD=dev_password_2024

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# API Gateway
API_PORT=4000
NODE_ENV=development

# JWT (development keys)
JWT_SECRET=dev_jwt_secret_2024
JWT_REFRESH_SECRET=dev_refresh_secret_2024
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Frontend
VITE_API_BASE_URL=http://localhost:4000
VITE_ENABLE_DEV_TOOLS=true

# Logging
LOG_LEVEL=debug
```

### Docker Compose para Desarrollo

```yaml
# docker-compose.dev.yml (simplificado)
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: adaptive_learning_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password_2024
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
      - ./database/postgresql_setup.py:/docker-entrypoint-initdb.d/init.py

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data

  # Servicios adicionales con hot-reload...
```

### Scripts de Desarrollo

```bash
# Iniciar todo el ecosistema
./scripts/dev-up.sh

# Parar todos los servicios
./scripts/dev-down.sh

# Reiniciar servicios
./scripts/dev-restart.sh

# Health check completo
./scripts/health-check.sh

# Ver logs en tiempo real
docker-compose logs -f

# Solo servicios base (DB + Cache)
docker-compose -f docker-compose.dev.yml up postgres redis
```

### Hot Reload Configuration

**Frontend** (Vite):
```javascript
// vite.config.ts
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    watch: {
      usePolling: true
    }
  }
});
```

**API Gateway** (NestJS):
```json
// package.json
{
  "scripts": {
    "start:dev": "nest start --watch --preserveWatchOutput"
  }
}
```

---

## 📊 Staging Environment

### Infraestructura de Staging

**Opción A: VPS/Cloud VM**
```bash
# Specs recomendadas
# - 8 vCPUs
# - 16GB RAM
# - 100GB SSD
# - Ubuntu 22.04 LTS
```

**Opción B: AWS/Azure/GCP**
```bash
# AWS: t3.xlarge o m5.xlarge
# Azure: Standard_D4s_v3
# GCP: n1-standard-4
```

### Setup de Staging

```bash
# 1. Preparar servidor
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose nginx certbot ufw -y

# 2. Configurar firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# 3. Clonar y configurar
git clone <repository-url>
cd adaptive-learning-ecosystem
cp .env.example .env.staging

# 4. Configurar SSL con Let's Encrypt
sudo certbot --nginx -d staging.adaptivelearning.com
```

### Configuración de Staging

**Archivo**: `.env.staging`
```bash
# Database (Managed PostgreSQL recomendado)
POSTGRES_HOST=staging-db.example.com
POSTGRES_PORT=5432
POSTGRES_DB=adaptive_learning_staging
POSTGRES_USER=staging_user
POSTGRES_PASSWORD=secure_staging_password_2024

# Redis (Managed Redis recomendado)
REDIS_HOST=staging-cache.example.com
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password_2024

# API Gateway
API_PORT=4000
NODE_ENV=staging

# JWT (staging keys - diferentes de producción)
JWT_SECRET=staging_jwt_secret_very_long_and_secure_2024
JWT_REFRESH_SECRET=staging_refresh_secret_very_long_and_secure_2024
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Frontend
VITE_API_BASE_URL=https://staging-api.adaptivelearning.com

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

### Nginx Configuration para Staging

```nginx
# /etc/nginx/sites-available/adaptive-learning-staging
server {
    listen 80;
    server_name staging.adaptivelearning.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name staging.adaptivelearning.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/staging.adaptivelearning.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.adaptivelearning.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API Gateway
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $http_host;
    }
    
    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Deployment a Staging

```bash
# Script automatizado de staging
#!/bin/bash
# deploy-staging.sh

set -e

echo "🚀 Deploying to Staging..."

# 1. Pull latest code
git pull origin main

# 2. Build images
docker-compose -f docker-compose.staging.yml build --no-cache

# 3. Backup database
docker-compose exec postgres pg_dump -U staging_user adaptive_learning_staging > \
    backup_staging_$(date +%Y%m%d_%H%M%S).sql

# 4. Deploy with zero downtime
docker-compose -f docker-compose.staging.yml up -d --force-recreate

# 5. Health check
sleep 30
./scripts/health-check.sh

echo "✓ Staging deployment completed"
```

---

## 🏆 Producción

### Arquitectura de Producción

```
                        ┌─────────────────────────┐
                        │      LOAD BALANCER      │
                        │    (AWS ALB/Nginx)     │
                        └───────────┬──────────────┘
                                 │
            ┌────────────────────┴────────────────────┐
            │                                                    │
  ┌─────────┬──────────────────────────────┴────────────────────┐
  │         │                                                    │
┌─┬─────────┬──────────────────────────────┴────────────────────┴────────────────────┐
│ │FRONTEND│                    API GATEWAY                   │           MICROSERVICES          │
│ │  CDN    │               (Multiple Instances)              │      (Auto-scaled Pods)          │
│ │CloudFront│                                                  │                                 │
└─┴─────────┴──────────────────────────────┴────────────────────┴────────────────────┘
              │                                                    │
              └────────────────────┴────────────────────┘
                                   │
                      ┌────────────────────┴────────────────────┐
                      │           MANAGED SERVICES           │
                      │                                      │
                      │  ┌───────────┐  ┌───────────────┐  │
                      │  │   RDS     │  │  ElastiCache  │  │
                      │  │PostgreSQL │  │     Redis    │  │
                      │  └───────────┘  └───────────────┘  │
                      └────────────────────────────────────────┘
```

### Opción 1: AWS ECS/Fargate

**Task Definition** (API Gateway):
```json
{
  "family": "adaptive-learning-api-gateway",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "api-gateway",
      "image": "your-ecr-repo/adaptive-learning-api-gateway:latest",
      "portMappings": [
        {
          "containerPort": 4000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/adaptive-learning",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "api-gateway"
        }
      }
    }
  ]
}
```

**Service Definition**:
```json
{
  "serviceName": "adaptive-learning-api-gateway",
  "cluster": "adaptive-learning-cluster",
  "taskDefinition": "adaptive-learning-api-gateway",
  "desiredCount": 3,
  "launchType": "FARGATE",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": ["subnet-xxx", "subnet-yyy"],
      "securityGroups": ["sg-xxx"],
      "assignPublicIp": "ENABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:...",
      "containerName": "api-gateway",
      "containerPort": 4000
    }
  ]
}
```

### Opción 2: Kubernetes

**Namespace**:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: adaptive-learning
```

**ConfigMap**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: adaptive-learning-config
  namespace: adaptive-learning
data:
  NODE_ENV: "production"
  POSTGRES_HOST: "rds-endpoint.region.rds.amazonaws.com"
  POSTGRES_PORT: "5432"
  POSTGRES_DB: "adaptive_learning"
  API_PORT: "4000"
```

**Secret**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: adaptive-learning-secrets
  namespace: adaptive-learning
type: Opaque
data:
  POSTGRES_PASSWORD: <base64-encoded>
  JWT_SECRET: <base64-encoded>
  JWT_REFRESH_SECRET: <base64-encoded>
```

**Deployment** (API Gateway):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: adaptive-learning
  labels:
    app: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: your-registry/adaptive-learning-api-gateway:latest
        ports:
        - containerPort: 4000
        envFrom:
        - configMapRef:
            name: adaptive-learning-config
        - secretRef:
            name: adaptive-learning-secrets
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Service**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
  namespace: adaptive-learning
spec:
  selector:
    app: api-gateway
  ports:
    - protocol: TCP
      port: 80
      targetPort: 4000
  type: LoadBalancer
```

**HorizontalPodAutoscaler**:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: adaptive-learning
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### CI/CD Pipeline

**GitHub Actions** (`.github/workflows/deploy-production.yml`):
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../api-gateway && npm ci
          
      - name: Run tests
        run: |
          cd frontend && npm test
          cd ../api-gateway && npm test
          
      - name: Build applications
        run: |
          cd frontend && npm run build
          cd ../api-gateway && npm run build

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run security scan
        uses: securecodewarrior/github-action-add-sarif@v1
        with:
          sarif-file: 'security-scan-results.sarif'

  build-and-push:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
          
      - name: Login to Amazon ECR
        uses: aws-actions/amazon-ecr-login@v1
        
      - name: Build and push Docker images
        run: |
          # Frontend
          docker build -t $ECR_REGISTRY/adaptive-learning-frontend:$GITHUB_SHA ./frontend
          docker push $ECR_REGISTRY/adaptive-learning-frontend:$GITHUB_SHA
          
          # API Gateway
          docker build -t $ECR_REGISTRY/adaptive-learning-api-gateway:$GITHUB_SHA ./api-gateway
          docker push $ECR_REGISTRY/adaptive-learning-api-gateway:$GITHUB_SHA
          
          # Microservices
          docker build -t $ECR_REGISTRY/adaptive-learning-ai-tutor:$GITHUB_SHA ./services/ai-tutor
          docker push $ECR_REGISTRY/adaptive-learning-ai-tutor:$GITHUB_SHA
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster adaptive-learning-cluster \
            --service adaptive-learning-api-gateway \
            --force-new-deployment
            
      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster adaptive-learning-cluster \
            --services adaptive-learning-api-gateway
            
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 📋 Monitoreo

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'adaptive-learning-api-gateway'
    static_configs:
      - targets: ['api-gateway:4000']
    metrics_path: '/metrics'
    
  - job_name: 'adaptive-learning-ai-tutor'
    static_configs:
      - targets: ['ai-tutor:5001']
    metrics_path: '/metrics'
    
  - job_name: 'adaptive-learning-progress'
    static_configs:
      - targets: ['progress-tracking:5004']
    metrics_path: '/metrics'
    
  - job_name: 'adaptive-learning-assessment'
    static_configs:
      - targets: ['assessment:5005']
    metrics_path: '/metrics'
    
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']
      
  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']
```

### Alert Rules

```yaml
# alert_rules.yml
groups:
  - name: adaptive-learning-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"
          
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }} seconds"
          
      - alert: DatabaseConnectionsHigh
        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
          description: "Database has {{ $value }} active connections"
          
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "{{ $labels.instance }} has been down for more than 1 minute"
```

### Grafana Dashboards

**API Gateway Dashboard**:
```json
{
  "dashboard": {
    "id": null,
    "title": "Adaptive Learning - API Gateway",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ]
      }
    ]
  }
}
```

---

## ⚠️ Troubleshooting

### Problemas Comunes

#### 1. Servicio no inicia
```bash
# Verificar logs
docker-compose logs service-name

# Verificar recursos
docker stats

# Verificar variables de entorno
docker-compose exec service-name env
```

#### 2. Base de datos no conecta
```bash
# Test conexión PostgreSQL
docker-compose exec postgres pg_isready -U adaptive_user

# Ver logs de PostgreSQL
docker-compose logs postgres

# Verificar permisos
docker-compose exec postgres psql -U adaptive_user -d adaptive_learning -c "\du"
```

#### 3. Redis no disponible
```bash
# Test conexión Redis
docker-compose exec redis redis-cli ping

# Ver info de Redis
docker-compose exec redis redis-cli info

# Verificar memoria
docker-compose exec redis redis-cli info memory
```

#### 4. Frontend no carga
```bash
# Verificar build
cd frontend && npm run build

# Verificar nginx config
docker-compose exec frontend nginx -t

# Ver logs de nginx
docker-compose logs frontend
```

### Scripts de Diagnóstico

```bash
#!/bin/bash
# diagnose.sh

echo "🔍 Sistema de Diagnóstico"
echo "============================="

# 1. Verificar contenedores
echo "📦 Estado de contenedores:"
docker-compose ps

# 2. Verificar recursos
echo "
📊 Uso de recursos:"
docker stats --no-stream

# 3. Health checks
echo "
🏥 Health checks:"
curl -s http://localhost:4000/health | jq
curl -s http://localhost:5001/health | jq
curl -s http://localhost:5004/health | jq
curl -s http://localhost:5005/health | jq

# 4. Base de datos
echo "
🗄️ Estado de base de datos:"
docker-compose exec -T postgres pg_isready -U adaptive_user

# 5. Cache
echo "
📦 Estado de Redis:"
docker-compose exec -T redis redis-cli ping

# 6. Logs recientes
echo "
📋 Logs recientes (errores):"
docker-compose logs --tail=50 | grep -i error
```

---

## 💾 Backup y Recovery

### Estrategia de Backup

#### 1. Backup Automatizado
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DATABASE="adaptive_learning"

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
echo "Creating PostgreSQL backup..."
docker-compose exec -T postgres pg_dump -U adaptive_user $DATABASE | \
    gzip > $BACKUP_DIR/postgres_${DATABASE}_${DATE}.sql.gz

# Backup Redis
echo "Creating Redis backup..."
docker-compose exec -T redis redis-cli --rdb /data/dump.rdb
docker cp $(docker-compose ps -q redis):/data/dump.rdb $BACKUP_DIR/redis_${DATE}.rdb

# Backup archivos de configuración
echo "Backing up configuration files..."
tar -czf $BACKUP_DIR/config_${DATE}.tar.gz .env* docker-compose*.yml

# Limpiar backups antiguos (30 días)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +30 -delete

echo "Backup completed: $DATE"
```

#### 2. Cron Job para Backups
```bash
# Agregar a crontab
0 2 * * * /path/to/adaptive-learning-ecosystem/backup.sh >> /var/log/backup.log 2>&1
```

### Procedimiento de Recovery

#### 1. Recovery PostgreSQL
```bash
#!/bin/bash
# restore-postgres.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

echo "Stopping services..."
docker-compose stop

echo "Starting only PostgreSQL..."
docker-compose up -d postgres

echo "Waiting for PostgreSQL..."
sleep 10

echo "Dropping existing database..."
docker-compose exec postgres psql -U adaptive_user -c "DROP DATABASE IF EXISTS adaptive_learning;"

echo "Creating new database..."
docker-compose exec postgres psql -U adaptive_user -c "CREATE DATABASE adaptive_learning;"

echo "Restoring from backup..."
gunzip -c $BACKUP_FILE | docker-compose exec -T postgres psql -U adaptive_user adaptive_learning

echo "Starting all services..."
docker-compose up -d

echo "Recovery completed"
```

#### 2. Recovery Redis
```bash
#!/bin/bash
# restore-redis.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.rdb>"
    exit 1
fi

echo "Stopping Redis..."
docker-compose stop redis

echo "Copying backup file..."
docker cp $BACKUP_FILE $(docker-compose ps -q redis):/data/dump.rdb

echo "Starting Redis..."
docker-compose up -d redis

echo "Redis recovery completed"
```

### Disaster Recovery Plan

#### 1. Preparación
- Backups automatizados diarios
- Replicación cross-region (producción)
- Documentación actualizada
- Scripts de recovery probados

#### 2. Procedimiento de Emergency
1. **Evaluar daño**: Determinar alcance del problema
2. **Comunicar**: Notificar a stakeholders
3. **Activar backup site**: Si es necesario
4. **Restaurar datos**: Desde backup más reciente
5. **Verificar integridad**: Tests de funcionamiento
6. **Comunicar resolución**: Update a usuarios

#### 3. RTO/RPO Targets
- **RTO** (Recovery Time Objective): 4 horas
- **RPO** (Recovery Point Objective): 1 hora

---

## 📊 Métricas de Éxito

### SLIs (Service Level Indicators)

| Métrica | Target | Medición |
|---------|--------|----------|
| **Availability** | 99.9% | Uptime monitoring |
| **Response Time** | <500ms p95 | Request duration |
| **Error Rate** | <0.1% | 5xx responses |
| **Throughput** | 1000 req/s | Requests per second |

### Alertas Críticas

1. **Service Down**: Alerta inmediata
2. **High Error Rate**: >1% durante 5 min
3. **Slow Response**: p95 >1s durante 5 min
4. **Database Issues**: Connection failures
5. **Disk Space**: >85% utilizado

---

**Última actualización**: Enero 2025  
**Versión**: v1.0.0  
**Mantenido por**: EbroValley Digital Team