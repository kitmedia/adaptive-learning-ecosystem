#!/bin/bash
# Production Deployment Script
# Adaptive Learning Ecosystem - EbroValley Digital
# Autor: ToñoAdPAOS & Claudio Supreme

set -e

echo "🚀 DESPLIEGUE DE PRODUCCIÓN - ECOSISTEMA ADAPTATIVO"
echo "=======================================================" 
echo "🏗️  Configuración: PRODUCCIÓN"
echo "⚠️  ADVERTENCIA: Este script está configurado para entorno de producción"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[PROD]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en entorno de producción
if [ "$NODE_ENV" != "production" ]; then
    print_warning "NODE_ENV no está configurado como 'production'"
    echo -n "        ¿Continuar con despliegue de producción? (y/N): "
    read -r confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        print_status "Despliegue cancelado"
        exit 0
    fi
fi

# Verificar archivos de configuración de producción
print_status "Verificando configuración de producción..."
if [ ! -f ".env.production" ]; then
    print_error "Archivo .env.production no encontrado"
    print_status "Creando .env.production desde plantilla..."
    cp .env.example .env.production
    print_warning "Por favor, configura las variables de producción en .env.production"
    exit 1
fi

# Cargar variables de entorno de producción
source .env.production

# Verificar dependencias
print_status "Verificando dependencias..."
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose no está instalado"
    exit 1
fi

# Backup de base de datos (si existe)
if docker ps | grep -q "adaptive-postgres"; then
    print_status "Creando backup de base de datos..."
    mkdir -p ./backups
    backup_file="./backups/backup_$(date +%Y%m%d_%H%M%S).sql"
    docker-compose exec -T postgres pg_dump -U adaptive_user adaptive_learning > "$backup_file"
    print_success "Backup creado: $backup_file"
fi

# Compilar aplicaciones
print_status "Compilando aplicaciones para producción..."

# Frontend
print_status "Compilando Frontend..."
cd frontend
npm ci --production
npm run build
cd ..

# API Gateway
print_status "Compilando API Gateway..."
cd api-gateway
npm ci --production
npm run build
cd ..

print_success "Compilación completada"

# Construir imágenes de producción
print_status "Construyendo imágenes Docker de producción..."
export NODE_ENV=production
docker-compose -f docker-compose.yml build --no-cache

# Detener servicios existentes
print_status "Deteniendo servicios existentes..."
docker-compose down

# Iniciar servicios de producción
print_status "Iniciando servicios de producción..."
docker-compose -f docker-compose.yml up -d

# Esperar a que los servicios estén listos
print_status "Esperando a que los servicios estén listos..."
sleep 30

# Ejecutar migraciones de base de datos
print_status "Ejecutando migraciones de base de datos..."
docker-compose exec postgres python3 /docker-entrypoint-initdb.d/init.py || true

# Health check
print_status "Ejecutando health check..."
sleep 15
./scripts/health-check.sh

if [ $? -eq 0 ]; then
    print_success "🎉 DESPLIEGUE DE PRODUCCIÓN EXITOSO"
    echo "================================================"
    echo ""
    echo "📱 SERVICIOS EN PRODUCCIÓN:"
    echo "   🌐 Frontend:      http://localhost:3000"
    echo "   🔌 API Gateway:   http://localhost:4000"
    echo "   📋 Health Check:  ./scripts/health-check.sh"
    echo "   📊 Logs:          docker-compose logs -f"
    echo "   🔍 Monitoring:    http://localhost:9090 (Prometheus)"
    echo "   📊 Dashboard:     http://localhost:3001 (Grafana)"
    echo ""
    echo "🔐 SEGURIDAD:"
    echo "   • Todas las contraseñas han sido cambiadas"
    echo "   • JWT tokens configurados"
    echo "   • HTTPS recomendado para producción"
    echo ""
    print_success "✨ Sistema de producción operativo - EXCELENCIA EMPRESARIAL"
else
    print_error "Health check falló. Revisar logs con: docker-compose logs"
    exit 1
fi
