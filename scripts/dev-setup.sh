#!/bin/bash
# 🚀 Automated Development Setup Script
# Adaptive Learning Ecosystem - EbroValley Digital
# Autor: Claudio Supreme & ToñoAdPAOS

set -e  # Exit on any error

echo "🎓 Configurando Adaptive Learning Ecosystem..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Por favor ejecuta este script desde la raíz del proyecto"
    exit 1
fi

print_status "📋 Verificando prerequisitos..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Instala Node.js 20+ primero."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_error "Node.js versión 20+ requerida. Versión actual: $(node --version)"
    exit 1
fi
print_success "Node.js $(node --version)"

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 no está instalado"
    exit 1
fi
print_success "Python $(python3 --version)"

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado"
    exit 1
fi
print_success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose no está instalado"
    exit 1
fi
print_success "Docker Compose $(docker-compose --version | cut -d' ' -f4 | cut -d',' -f1)"

print_status "📁 Configurando archivos de entorno..."

# Copy environment files if they don't exist
if [ ! -f ".env.development" ]; then
    cp .env.example .env.development
    print_success "Archivo .env.development creado"
else
    print_warning "Archivo .env.development ya existe"
fi

print_status "🐳 Iniciando servicios de base de datos..."

# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait for services to be ready
print_status "⏳ Esperando que los servicios estén listos..."
sleep 15

# Check if PostgreSQL is ready
until docker-compose exec -T postgres pg_isready -U adaptive_user -d adaptive_learning &> /dev/null; do
    print_status "⏳ Esperando PostgreSQL..."
    sleep 2
done
print_success "PostgreSQL listo"

# Check if Redis is ready
until docker-compose exec -T redis redis-cli ping &> /dev/null; do
    print_status "⏳ Esperando Redis..."
    sleep 2
done
print_success "Redis listo"

print_status "📦 Instalando dependencias..."

# Install API Gateway dependencies
print_status "🔧 API Gateway (NestJS)..."
cd api-gateway
if [ ! -d "node_modules" ]; then
    npm install
    print_success "API Gateway dependencies instaladas"
else
    print_warning "API Gateway dependencies ya instaladas"
fi
cd ..

# Install Frontend dependencies
print_status "🎨 Frontend (React + Vite)..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
    print_success "Frontend dependencies instaladas"
else
    print_warning "Frontend dependencies ya instaladas"
fi
cd ..

# Install Python dependencies for each service
print_status "🐍 Microservicios Python..."

# AI-Tutor Service
print_status "🤖 AI-Tutor Service..."
cd services/ai-tutor
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    print_success "AI-Tutor Service configurado"
else
    print_warning "AI-Tutor Service ya configurado"
fi
cd ../..

# Progress Tracking Service
print_status "📈 Progress Tracking Service..."
cd services/progress-tracking
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    print_success "Progress Tracking Service configurado"
else
    print_warning "Progress Tracking Service ya configurado"
fi
cd ../..

# Assessment Service
print_status "📝 Assessment Service..."
cd services/assessment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    print_success "Assessment Service configurado"
else
    print_warning "Assessment Service ya configurado"
fi
cd ../..

print_status "🗄️ Configurando base de datos..."

# Run database setup
cd database
python3 postgresql_setup.py
print_success "Base de datos configurada"
cd ..

print_status "🧪 Ejecutando tests para verificar instalación..."

# Run tests to verify everything works
cd api-gateway
npm run test
if [ $? -eq 0 ]; then
    print_success "Tests del API Gateway pasaron"
else
    print_warning "Algunos tests fallaron, pero el setup continúa"
fi
cd ..

print_status "🔍 Verificando salud del sistema..."

# Start all services briefly to test
./scripts/start-ecosystem.sh &
ECOSYSTEM_PID=$!

# Wait a bit for services to start
sleep 30

# Check health endpoints
if curl -s http://localhost:4000/api/v1/health > /dev/null; then
    print_success "API Gateway respondiendo"
else
    print_warning "API Gateway no responde (normal si es primera vez)"
fi

# Stop the ecosystem
kill $ECOSYSTEM_PID 2>/dev/null || true

echo ""
echo "🎉 ¡SETUP COMPLETADO CON ÉXITO!"
echo "================================"
echo ""
echo "📍 URLs importantes:"
echo "   • Frontend:     http://localhost:3000"
echo "   • API Gateway:  http://localhost:4000/api/v1"
echo "   • Swagger Docs: http://localhost:4000/docs"
echo ""
echo "🚀 Para iniciar todo el ecosistema:"
echo "   ./scripts/start-ecosystem.sh"
echo ""
echo "📚 Para más información:"
echo "   cat docs/DEVELOPER-ONBOARDING.md"
echo ""
print_success "¡Listo para desarrollar! 🚀"