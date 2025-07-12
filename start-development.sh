#!/bin/bash

# Adaptive Learning Ecosystem - Development Startup Script
# EbroValley Digital - ToñoAdPAOS & Claudio Supreme

echo "🚀 Iniciando Adaptive Learning Ecosystem - Modo Desarrollo"
echo "=============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}⚠️  Puerto $1 ya está en uso${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Puerto $1 disponible${NC}"
        return 0
    fi
}

# Function to start a service
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3
    local command=$4
    
    echo -e "${BLUE}🔄 Iniciando $service_name en puerto $port...${NC}"
    
    if check_port $port; then
        cd $service_path
        
        # Start service in background
        if [[ $command == *"python"* ]]; then
            # Activate virtual environment for Python services
            source ../../venv/bin/activate
        fi
        
        eval $command &
        local pid=$!
        echo $pid > ${service_name}.pid
        
        # Wait a moment and check if service started
        sleep 2
        if kill -0 $pid 2>/dev/null; then
            echo -e "${GREEN}✅ $service_name iniciado correctamente (PID: $pid)${NC}"
        else
            echo -e "${RED}❌ Error iniciando $service_name${NC}"
        fi
        
        cd - > /dev/null
    else
        echo -e "${RED}❌ No se puede iniciar $service_name - puerto ocupado${NC}"
    fi
}

# Function to stop all services
stop_services() {
    echo -e "${YELLOW}🛑 Deteniendo todos los servicios...${NC}"
    
    # Kill services by PID files
    for pid_file in services/*/*.pid api-gateway/*.pid frontend/*.pid; do
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file")
            if kill -0 $pid 2>/dev/null; then
                kill $pid
                echo -e "${GREEN}✅ Servicio detenido (PID: $pid)${NC}"
            fi
            rm -f "$pid_file"
        fi
    done
    
    # Kill any remaining processes on our ports
    for port in 3000 4000 5001 5002 5003 5004 5005 5006 5007; do
        pid=$(lsof -ti:$port)
        if [ ! -z "$pid" ]; then
            kill $pid 2>/dev/null
            echo -e "${GREEN}✅ Proceso en puerto $port detenido${NC}"
        fi
    done
}

# Trap to stop services on script exit
trap stop_services EXIT

# Check if environment files exist
echo -e "${BLUE}📋 Verificando archivos de configuración...${NC}"

if [ ! -f ".env.development" ]; then
    echo -e "${YELLOW}⚠️  .env.development no encontrado, copiando desde template...${NC}"
    cp .env.example .env.development
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Entorno virtual no encontrado, creando...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    cd services/ai-tutor && pip install -r requirements.txt && cd -
fi

# Check if database exists
if [ ! -f "database/adaptive_learning.db" ]; then
    echo -e "${YELLOW}⚠️  Base de datos no encontrada, creando...${NC}"
    source venv/bin/activate
    python database/create_sqlite.py
fi

echo -e "${GREEN}✅ Configuración verificada${NC}"
echo ""

# Start services in order
echo -e "${BLUE}🎯 Iniciando servicios en orden de dependencias...${NC}"
echo ""

# 1. Start AI-Tutor Service (already working)
start_service "ai-tutor" "services/ai-tutor" "5001" "python main.py"

# Wait a bit between services
sleep 3

# 2. Start API Gateway (if exists)
if [ -d "api-gateway" ]; then
    start_service "api-gateway" "api-gateway" "4000" "npm run dev"
else
    echo -e "${YELLOW}⚠️  API Gateway no encontrado, saltando...${NC}"
fi

# 3. Start Frontend (if exists)
if [ -d "frontend" ]; then
    start_service "frontend" "frontend" "3000" "npm run dev"
else
    echo -e "${YELLOW}⚠️  Frontend no encontrado, saltando...${NC}"
fi

echo ""
echo -e "${GREEN}🎉 ¡Adaptive Learning Ecosystem iniciado correctamente!${NC}"
echo "=============================================================="
echo -e "${BLUE}📡 Servicios disponibles:${NC}"
echo "  • AI-Tutor Service:    http://localhost:5001"
echo "  • Health Check:        http://localhost:5001/health"
echo "  • API Documentation:   http://localhost:5001/docs"
if [ -d "api-gateway" ]; then
    echo "  • API Gateway:         http://localhost:4000"
fi
if [ -d "frontend" ]; then
    echo "  • Frontend:            http://localhost:3000"
fi
echo ""
echo -e "${YELLOW}💡 Comandos útiles:${NC}"
echo "  • Ctrl+C para detener todos los servicios"
echo "  • ./scripts/test-ecosystem.sh para ejecutar pruebas"
echo "  • ./scripts/monitor-ecosystem.sh para monitoreo"
echo ""
echo -e "${BLUE}🧠 AI-Tutor Endpoints activos:${NC}"
echo "  • POST /diagnostic/generate"
echo "  • POST /diagnostic/analyze"
echo "  • GET  /path/adaptive/{student_id}"
echo "  • POST /feedback/realtime"
echo "  • GET  /students/{student_id}/profile"
echo ""

# Keep script running and show logs
echo -e "${GREEN}🔍 Logs en tiempo real (Ctrl+C para salir):${NC}"
echo "=============================================================="

# Follow logs from AI-Tutor service
tail -f services/ai-tutor/logs/*.log 2>/dev/null || echo "📝 Logs no disponibles, servicios ejecutándose..."

# Wait for user to stop
wait