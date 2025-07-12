# 🐳 DOCKERIZACIÓN COMPLETA - ECOSISTEMA DE APRENDIZAJE ADAPTATIVO

## 🏆 EXCELENCIA TÉCNICA EN CONTENEDORES
**Autor**: ToñoAdPAOS & Claudio Supreme  
**Organización**: EbroValley Digital  
**Arquitectura**: Microservicios Dockerizados de Clase Mundial

---

## 🚀 CARACTERÍSTICAS EMPRESARIALES

### ✅ INFRAESTRUCTURA COMPLETA
- **6 Servicios Dockerizados**: Frontend, API Gateway, 3 Microservicios, PostgreSQL, Redis
- **Multi-stage Builds**: Optimización máxima de tamaño de imágenes
- **Health Checks**: Monitoreo automático de servicios
- **Resource Limits**: Control de memoria y CPU por servicio
- **Networks**: Aislamiento de red empresarial
- **Volumes**: Persistencia de datos garantizada

### 🔧 SCRIPTS INTELIGENTES
- **dev-up.sh**: Inicio completo del ecosistema
- **dev-down.sh**: Apagado limpio con opciones
- **health-check.sh**: Verificación integral de servicios
- **production-deploy.sh**: Despliegue de producción automatizado

---

## 📋 PREREQUISITOS

### 1. Instalar Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Windows/Mac
# Descargar Docker Desktop desde: https://www.docker.com/products/docker-desktop
```

### 2. Instalar Docker Compose
```bash
# Linux
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker --version
docker-compose --version
```

---

## 🎯 INICIO RÁPIDO

### Opción A: Scripts Automatizados (Recomendado)
```bash
# Iniciar ecosistema completo
./scripts/dev-up.sh

# Verificar estado
./scripts/health-check.sh

# Detener servicios
./scripts/dev-down.sh
```

### Opción B: Comandos Docker Compose
```bash
# Desarrollo
docker-compose -f docker-compose.dev.yml up -d

# Producción
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

---

## 🌐 SERVICIOS Y PUERTOS

| Servicio | Puerto | URL | Descripción |
|----------|--------|-----|-------------|
| **Frontend** | 3000 | http://localhost:3000 | React SPA con Nginx |
| **API Gateway** | 4000 | http://localhost:4000 | NestJS con JWT Auth |
| **AI Tutor** | 5001 | http://localhost:5001 | FastAPI + ML Models |
| **Progress Tracking** | 5004 | http://localhost:5004 | FastAPI + Analytics |
| **Assessment** | 5005 | http://localhost:5005 | FastAPI + Evaluaciones |
| **PostgreSQL** | 5432 | localhost:5432 | Base de datos principal |
| **Redis** | 6379 | localhost:6379 | Cache y sesiones |
| **Prometheus** | 9090 | http://localhost:9090 | Métricas (opcional) |
| **Grafana** | 3001 | http://localhost:3001 | Dashboard (opcional) |

---

## 🔐 CREDENCIALES Y CONFIGURACIÓN

### Credenciales Demo
```
Usuario: ana_estudiante
Password: demo123
```

### PostgreSQL
```
Host: postgres (interno) / localhost (externo)
Port: 5432
Database: adaptive_learning
User: adaptive_user
Password: adaptive_password_2024
```

### Redis
```
Host: redis (interno) / localhost (externo)
Port: 6379
Password: adaptive_redis_2024
```

---

## 🛠️ COMANDOS ÚTILES

### Gestión de Servicios
```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs de un servicio específico
docker-compose logs -f api-gateway

# Reiniciar un servicio
docker-compose restart frontend

# Ejecutar comando en contenedor
docker-compose exec postgres psql -U adaptive_user -d adaptive_learning

# Acceder a shell de contenedor
docker-compose exec api-gateway sh
```

### Desarrollo
```bash
# Reconstruir imágenes
docker-compose build --no-cache

# Solo servicios básicos (DB + Cache)
docker-compose -f docker-compose.dev.yml up postgres redis

# Limpiar todo
./scripts/dev-down.sh --clean
```

### Monitoreo
```bash
# Estadísticas de recursos
docker stats

# Health check completo
./scripts/health-check.sh

# Ver métricas Prometheus
curl http://localhost:9090/metrics
```

---

## 🎛️ CONFIGURACIONES AVANZADAS

### Variables de Entorno
Cada servicio utiliza variables de entorno definidas en:
- `docker-compose.yml` (producción)
- `docker-compose.dev.yml` (desarrollo)
- `.env.production` (configuración específica)

### Perfiles Docker Compose
```bash
# Solo monitoreo
docker-compose --profile monitoring up

# Servicios completos + monitoreo
docker-compose --profile monitoring --profile full up
```

### Escalado Horizontal
```bash
# Escalar microservicios
docker-compose up -d --scale ai-tutor-service=3
docker-compose up -d --scale progress-tracking-service=2
```

---

## 🔧 TROUBLESHOOTING

### Problemas Comunes

**🚨 Error: Puerto ya en uso**
```bash
# Verificar puertos ocupados
sudo netstat -tulpn | grep :3000

# Cambiar puerto en docker-compose.yml
ports:
  - "3001:3000"  # Cambiar puerto externo
```

**🚨 Error: Memoria insuficiente**
```bash
# Aumentar memoria de Docker Desktop
# Settings > Resources > Memory > 4GB+

# O reducir servicios
docker-compose -f docker-compose.dev.yml up postgres redis
```

**🚨 Error: Base de datos no conecta**
```bash
# Verificar estado de PostgreSQL
docker-compose logs postgres

# Reiniciar solo PostgreSQL
docker-compose restart postgres

# Verificar conexión
docker-compose exec postgres pg_isready -U adaptive_user
```

### Logs y Debugging
```bash
# Logs detallados
docker-compose logs -f --tail=100

# Logs específicos por servicio
docker-compose logs frontend
docker-compose logs api-gateway
docker-compose logs ai-tutor-service

# Entrar al contenedor para debug
docker-compose exec api-gateway bash
```

---

## 🚀 DESPLIEGUE EN PRODUCCIÓN

### Preparación
1. **Configurar variables de producción**
   ```bash
   cp .env.example .env.production
   # Editar .env.production con valores reales
   ```

2. **Configurar SSL/HTTPS**
   - Usar reverse proxy (Nginx/Traefik)
   - Certificados SSL/TLS
   - Configurar dominios

3. **Seguridad**
   - Cambiar todas las contraseñas
   - Configurar firewall
   - Usar secretos de Docker Swarm/Kubernetes

### Despliegue Automatizado
```bash
# Script de producción completo
./scripts/production-deploy.sh
```

### Docker Swarm (Orquestación)
```bash
# Inicializar swarm
docker swarm init

# Desplegar stack
docker stack deploy -c docker-compose.yml adaptive-learning

# Ver servicios
docker service ls
```

---

## 📊 MÉTRICAS Y MONITOREO

### Prometheus + Grafana
```bash
# Iniciar con monitoreo
docker-compose --profile monitoring up -d

# Acceder a dashboards
open http://localhost:9090  # Prometheus
open http://localhost:3001  # Grafana (admin/adaptive_grafana_2024)
```

### Health Checks Automáticos
Todos los servicios incluyen health checks:
- **Intervalo**: 30 segundos
- **Timeout**: 10 segundos
- **Retries**: 3 intentos
- **Start Period**: 40-60 segundos

---

## 🏗️ ARQUITECTURA DE CONTENEDORES

```
┌─────────────────────────────────────────────────────────────┐
│                     ADAPTIVE NETWORK                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   FRONTEND  │  │ API GATEWAY │  │    MICROSERVICES    │  │
│  │   (Nginx)   │◄─┤   (NestJS)  │◄─┤  AI│Progress│Assess  │  │
│  │   Port 3000 │  │   Port 4000 │  │  5001│ 5004 │ 5005   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ POSTGRESQL  │  │    REDIS    │  │     MONITORING      │  │
│  │  Port 5432  │  │  Port 6379  │  │ Prometheus│Grafana  │  │
│  │             │  │             │  │   9090   │  3001   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎖️ LOGROS TÉCNICOS

### ✅ COMPLETADO CON EXCELENCIA
- **Multi-stage Dockerfiles** para optimización máxima
- **Health checks** empresariales en todos los servicios
- **Resource limits** para prevenir sobrecarga
- **Network isolation** para seguridad
- **Volume persistence** para datos críticos
- **Scripts automatizados** para operaciones
- **Monitoring stack** con Prometheus + Grafana
- **Production-ready** configuration

### 🚀 BENEFICIOS EMPRESARIALES
- **Escalabilidad**: Fácil escalado horizontal
- **Portabilidad**: Funciona en cualquier entorno
- **Consistencia**: Mismo entorno dev/staging/prod
- **Isolation**: Servicios completamente aislados
- **Orchestration**: Listo para Kubernetes/Swarm
- **Monitoring**: Observabilidad completa
- **Security**: Usuarios no-root, secrets management

---

## 🤝 SOPORTE

Para soporte técnico:
1. **Revisar logs**: `docker-compose logs`
2. **Health check**: `./scripts/health-check.sh`
3. **Documentación**: Este README
4. **Issues**: Crear issue en repositorio

---

**🏆 DOCKERIZACIÓN EMPRESARIAL COMPLETADA**  
*Sistema containerizado de clase mundial - Listo para producción*

*"Como fluye el agua de un río" - Arquitectura que fluye naturalmente* 🌊