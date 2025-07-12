#!/bin/bash
# Development Environment Startup Script
# Adaptive Learning Ecosystem - EbroValley Digital
# Autor: ToñoAdPAOS & Claudio Supreme

set -e

echo "🚀 INICIANDO ECOSISTEMA DE APRENDIZAJE ADAPTATIVO"
echo "===================================================="
echo "🏗️  Configuración: Desarrollo"
echo "📊 Servicios: Frontend + API Gateway + 3 Microservicios + PostgreSQL + Redis"
echo ""

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker no está ejecutándose. Por favor inicia Docker Desktop."
    exit 1
fi

print_success "Docker está ejecutándose"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose no está instalado"
    exit 1
fi

# Clean previous containers if any
print_status "Limpiando contenedores previos..."
docker-compose down --remove-orphans 2>/dev/null || true

# Build and start services
print_status "Construyendo imágenes Docker..."
docker-compose build --parallel

print_status "Iniciando servicios..."
docker-compose up -d postgres redis

print_status "Esperando a que PostgreSQL esté listo..."
echo "⏳ Esto puede tardar 30-60 segundos..."

# Wait for PostgreSQL to be ready
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U adaptive_user -d adaptive_learning > /dev/null 2>&1; then
        print_success "PostgreSQL está listo"
        break
    fi
    echo -n "."
    sleep 2
done

print_status "Esperando a que Redis esté listo..."
for i in {1..15}; do
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis está listo"
        break
    fi
    echo -n "."
    sleep 1
done

# Start microservices
print_status "Iniciando microservicios..."
docker-compose up -d ai-tutor-service progress-tracking-service assessment-service

print_status "Esperando a que los microservicios estén listos..."
sleep 20

# Start API Gateway
print_status "Iniciando API Gateway..."
docker-compose up -d api-gateway

print_status "Esperando a que API Gateway esté listo..."
sleep 15

# Start Frontend
print_status "Iniciando Frontend..."
docker-compose up -d frontend

print_status "Esperando a que Frontend esté listo..."
sleep 10

echo ""
print_success "🎉 ECOSISTEMA INICIADO EXITOSAMENTE"
echo "===================================="
echo ""
echo "📱 ACCESOS DISPONIBLES:"
echo "   🌐 Frontend:     http://localhost:3000"
echo "   🔌 API Gateway:  http://localhost:4000"
echo "   🤖 AI Tutor:     http://localhost:5001"
echo "   📊 Progress:     http://localhost:5004"
echo "   📝 Assessment:   http://localhost:5005"
echo "   🗄️  PostgreSQL:   localhost:5432"
echo "   📦 Redis:        localhost:6379"
echo ""
echo "🔐 CREDENCIALES DEMO:"
echo "   👤 Usuario: ana_estudiante"
echo "   🔑 Password: demo123"
echo ""
echo "📋 COMANDOS ÚTILES:"
echo "   📊 Ver logs:      docker-compose logs -f"
echo "   🛑 Parar todo:    ./scripts/dev-down.sh"
echo "   🔄 Reiniciar:     ./scripts/dev-restart.sh"
echo "   🏥 Health check:  ./scripts/health-check.sh"
echo ""
print_success "✨ Sistema listo para desarrollo - ¡EXCELENCIA TÉCNICA!"
