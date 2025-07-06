# 🚀 Deployment Guide

**Adaptive Learning Ecosystem - Production Deployment**  
*EbroValley Digital - ToñoAdPAOS & Claudio Supreme*

## 🎯 Production Architecture

### Infrastructure Requirements
- **CPU**: 8+ cores recommended for ML processing
- **RAM**: 16GB+ for ML models and caching
- **Storage**: 100GB+ SSD for database and content
- **Network**: 1Gbps+ for real-time features

### Recommended Cloud Providers
- **AWS**: EC2 + RDS + ElastiCache + S3
- **DigitalOcean**: Droplets + Managed Databases + Spaces
- **Google Cloud**: Compute Engine + Cloud SQL + Memorystore

## 🐳 Docker Production Setup

### 1. Build Production Images
```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Tag for registry
docker tag adaptive-learning-api-gateway:latest your-registry/adaptive-learning-api-gateway:v1.0.0
docker tag adaptive-learning-ai-tutor:latest your-registry/adaptive-learning-ai-tutor:v1.0.0
```

### 2. Environment Configuration
Create production environment files:

**`.env.production`**
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/adaptive_learning_prod
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333

# API Keys
JWT_SECRET=your-super-secure-jwt-secret-key
OPENAI_API_KEY=your-openai-api-key
CLAUDE_API_KEY=your-claude-api-key

# Services
API_GATEWAY_PORT=4000
AI_TUTOR_PORT=5001
FRONTEND_PORT=3000

# Security
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RATE_LIMIT_MAX=1000
```

### 3. Production Docker Compose
**`docker-compose.prod.yml`**
```yaml
version: '3.8'

services:
  postgresql:
    image: postgres:15
    environment:
      POSTGRES_DB: adaptive_learning_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    ports:
      - "5433:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage
    restart: unless-stopped

  api-gateway:
    build:
      context: ./api-gateway
      dockerfile: Dockerfile.prod
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgresql
      - redis
    restart: unless-stopped

  ai-tutor:
    build:
      context: ./services/ai-tutor
      dockerfile: Dockerfile.prod
    ports:
      - "5001:5001"
    environment:
      - ENVIRONMENT=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - QDRANT_URL=${QDRANT_URL}
    depends_on:
      - postgresql
      - redis
      - qdrant
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=https://api.yourdomain.com
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  qdrant_data:
```

## ☸️ Kubernetes Deployment

### 1. Namespace Setup
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: adaptive-learning
```

### 2. Database Deployments
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgresql
  namespace: adaptive-learning
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgresql
  template:
    metadata:
      labels:
        app: postgresql
    spec:
      containers:
      - name: postgresql
        image: postgres:15
        env:
        - name: POSTGRES_DB
          value: adaptive_learning_prod
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
```

### 3. AI-Tutor Service Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-tutor
  namespace: adaptive-learning
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-tutor
  template:
    metadata:
      labels:
        app: ai-tutor
    spec:
      containers:
      - name: ai-tutor
        image: your-registry/adaptive-learning-ai-tutor:v1.0.0
        ports:
        - containerPort: 5001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: redis-url
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 5001
          initialDelaySeconds: 5
          periodSeconds: 5
```

## 🔒 SSL/TLS Setup

### 1. Let's Encrypt with Certbot
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Nginx Configuration
```nginx
upstream api_backend {
    server localhost:4000;
}

upstream ai_tutor_backend {
    server localhost:5001;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Gateway
    location /api/ {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # AI-Tutor Service
    location /ai-tutor/ {
        proxy_pass http://ai_tutor_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support for real-time features
    location /socket.io/ {
        proxy_pass http://localhost:5004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## 📊 Monitoring & Observability

### 1. Health Check Endpoints
```javascript
// API Gateway health check
GET /api/v1/health
{
  "status": "healthy",
  "timestamp": "2025-07-06T21:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "ai-tutor": "healthy"
  }
}
```

### 2. Logging Configuration
```yaml
# Docker Compose logging
services:
  ai-tutor:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 3. Metrics Collection
```bash
# Prometheus metrics endpoint
curl http://localhost:5001/metrics

# Expected metrics
adaptive_learning_active_students_total
adaptive_learning_ml_predictions_total
adaptive_learning_feedback_generated_total
adaptive_learning_response_time_seconds
```

## 🔧 Production Optimization

### 1. Database Optimization
```sql
-- PostgreSQL production settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
SELECT pg_reload_conf();
```

### 2. Redis Optimization
```bash
# Redis production config
maxmemory 1gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 3. AI-Tutor Model Optimization
```python
# Model caching for production
from joblib import Memory
memory = Memory('./model_cache', verbose=0)

@memory.cache
def load_ml_model():
    return RandomForestRegressor.load('production_model.pkl')
```

## 🔐 Security Hardening

### 1. Environment Security
```bash
# Secure file permissions
chmod 600 .env.production
chown root:root .env.production

# Firewall configuration
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 5432/tcp  # Only allow local DB access
ufw enable
```

### 2. Application Security
```javascript
// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
}));

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

## 📋 Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations applied
- [ ] AI models trained and validated
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Backup strategy implemented

### Post-deployment
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Log aggregation working
- [ ] Performance metrics baseline established
- [ ] User acceptance testing completed
- [ ] Documentation updated
- [ ] Team trained on operations

---

**Built with ❤️ by EbroValley Digital**  
*"From Aragón to the world - Technology with working-class values"*