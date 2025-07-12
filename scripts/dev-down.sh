#!/bin/bash
# Development Environment Shutdown Script
# Adaptive Learning Ecosystem - EbroValley Digital
# Autor: ToñoAdPAOS & Claudio Supreme

set -e

echo "🛑 DETENIENDO ECOSISTEMA DE APRENDIZAJE ADAPTATIVO"
echo "====================================================="

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if services are running
if ! docker-compose ps | grep -q "Up"; then
    print_warning "No hay servicios ejecutándose"
    exit 0
fi

print_status "Deteniendo todos los servicios..."
docker-compose down

print_status "Limpiando contenedores huérfanos..."
docker-compose down --remove-orphans

if [ "$1" = "--clean" ]; then
    print_warning "Eliminando volúmenes de datos (esto borrará la base de datos)..."
    docker-compose down -v
    print_warning "Eliminando imágenes locales..."
    docker system prune -f
fi

print_success "✓ Ecosistema detenido exitosamente"
echo ""
echo "📋 Para volver a iniciarlo: ./scripts/dev-up.sh"
echo "🧙 Para limpiar completamente: ./scripts/dev-down.sh --clean"
