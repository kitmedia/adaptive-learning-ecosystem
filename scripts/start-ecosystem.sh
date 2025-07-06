#!/bin/bash

# 🚀 Adaptive Learning Ecosystem - Start Script
# EbroValley Digital - ToñoAdPAOS & Claudio Supreme

echo "🎓 Iniciando Adaptive Learning Ecosystem..."
echo "============================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Función para verificar si un puerto está ocupado
check_port() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
            return 1  # Puerto ocupado
        fi
    fi
    return 0  # Puerto libre
}

# Función para cleanup al salir
cleanup() {
    echo ""
    log_info "Deteniendo servicios..."
    
    # Detener procesos background si existen
    if [[ -f .pids ]]; then
        while read pid; do
            if kill -0 $pid 2>/dev/null; then
                kill $pid 2>/dev/null
                log_info "Detenido proceso $pid"
            fi
        done < .pids
        rm .pids
    fi
    
    # Detener Docker services si están corriendo
    if command -v docker >/dev/null 2>&1; then
        log_info "Deteniendo servicios Docker..."
        docker compose down >/dev/null 2>&1
    fi
    
    log_success "Servicios detenidos correctamente"
    exit 0
}

# Configurar trap para cleanup
trap cleanup SIGINT SIGTERM

# 1. Validar prerequisitos
log_info "Verificando prerequisitos..."

# Verificar Node.js para API Gateway
if ! command -v node >/dev/null 2>&1; then
    log_warning "Node.js no encontrado, puede afectar API Gateway"
fi

# Verificar Python para AI-Tutor
if ! command -v python3 >/dev/null 2>&1; then
    log_warning "Python3 no encontrado, puede afectar AI-Tutor Service"
fi

# 2. Verificar puertos
log_info "Verificando disponibilidad de puertos..."

PORTS=(4000 5001 5433 6380 6333)
SERVICES=("API Gateway" "AI-Tutor" "PostgreSQL" "Redis" "Qdrant")

for i in "${!PORTS[@]}"; do
    PORT=${PORTS[$i]}
    SERVICE=${SERVICES[$i]}
    
    if ! check_port $PORT; then
        log_warning "Puerto $PORT ocupado (${SERVICE}), puede causar conflictos"
    else
        log_success "Puerto $PORT disponible para ${SERVICE}"
    fi
done

# 3. Iniciar base de datos (si Docker está disponible)
if command -v docker >/dev/null 2>&1; then
    log_info "Iniciando servicios de base de datos con Docker..."
    
    if docker compose up -d postgres-education redis-education qdrant >/dev/null 2>&1; then
        log_success "Servicios de base de datos iniciados"
        
        # Esperar a que las bases estén listas
        log_info "Esperando que las bases de datos estén listas..."
        sleep 5
        
        # Verificar conexión PostgreSQL
        for i in {1..10}; do
            if docker compose exec postgres-education pg_isready -U edu_user -d adaptive_learning >/dev/null 2>&1; then
                log_success "PostgreSQL listo"
                break
            fi
            sleep 2
        done
    else
        log_warning "No se pudieron iniciar servicios Docker, continuando sin base de datos"
    fi
else
    log_warning "Docker no disponible, servicios de base de datos no iniciados"
fi

# 4. Iniciar API Gateway
log_info "Iniciando API Gateway..."

cd api-gateway
if [[ -f "package.json" ]]; then
    # Verificar si las dependencias están instaladas
    if [[ ! -d "node_modules" ]] && command -v npm >/dev/null 2>&1; then
        log_info "Instalando dependencias de API Gateway..."
        npm install >/dev/null 2>&1
    fi
    
    if command -v npm >/dev/null 2>&1; then
        # Intentar compilar primero
        if npx tsc --noEmit >/dev/null 2>&1; then
            log_success "API Gateway compila correctamente"
            
            # Iniciar en modo desarrollo
            npm run start:dev >/dev/null 2>&1 &
            API_GATEWAY_PID=$!
            echo $API_GATEWAY_PID >> ../.pids
            
            log_success "API Gateway iniciado en puerto 4000 (PID: $API_GATEWAY_PID)"
        else
            log_error "API Gateway tiene errores de compilación"
        fi
    else
        log_warning "npm no disponible, API Gateway no iniciado"
    fi
else
    log_error "package.json no encontrado en api-gateway/"
fi
cd ..

# 5. Iniciar AI-Tutor Service
log_info "Iniciando AI-Tutor Service..."

cd services/ai-tutor
if [[ -f "app/main.py" ]]; then
    # Verificar Python y dependencias
    if command -v python3 >/dev/null 2>&1; then
        # Crear virtual environment si no existe
        if [[ ! -d "venv" ]]; then
            log_info "Creando virtual environment para AI-Tutor..."
            python3 -m venv venv >/dev/null 2>&1
        fi
        
        # Activar virtual environment
        source venv/bin/activate 2>/dev/null
        
        # Instalar dependencias si no están
        if [[ ! -f "venv/requirements_installed.flag" ]] && [[ -f "requirements.txt" ]]; then
            log_info "Instalando dependencias de AI-Tutor..."
            pip install -r requirements.txt >/dev/null 2>&1
            touch venv/requirements_installed.flag
        fi
        
        # Verificar sintaxis Python
        if python -c "import app.main" >/dev/null 2>&1; then
            log_success "AI-Tutor Service sintaxis válida"
            
            # Iniciar servicio
            python app/main.py >/dev/null 2>&1 &
            AI_TUTOR_PID=$!
            echo $AI_TUTOR_PID >> ../../.pids
            
            log_success "AI-Tutor Service iniciado en puerto 5001 (PID: $AI_TUTOR_PID)"
        else
            log_error "AI-Tutor Service tiene errores de sintaxis"
        fi
        
        deactivate 2>/dev/null
    else
        log_warning "Python3 no disponible, AI-Tutor Service no iniciado"
    fi
else
    log_error "main.py no encontrado en services/ai-tutor/app/"
fi
cd ../..

# 6. Esperar a que los servicios estén listos
log_info "Esperando que los servicios estén completamente listos..."
sleep 5

# 7. Verificar que los servicios responden
log_info "Verificando conectividad de servicios..."

# Test API Gateway
if command -v curl >/dev/null 2>&1; then
    if curl -s http://localhost:4000/api/v1/health >/dev/null 2>&1; then
        log_success "API Gateway responde correctamente"
    else
        log_warning "API Gateway no responde en puerto 4000"
    fi
    
    # Test AI-Tutor
    if curl -s http://localhost:5001/health >/dev/null 2>&1; then
        log_success "AI-Tutor Service responde correctamente"
    else
        log_warning "AI-Tutor Service no responde en puerto 5001"
    fi
else
    log_warning "curl no disponible, saltando tests de conectividad"
fi

# 8. Mostrar información de servicios activos
echo ""
echo "============================================"
log_success "🎉 Adaptive Learning Ecosystem iniciado"
echo "============================================"
echo ""
echo -e "${BLUE}📍 URLs de servicios:${NC}"
echo "   🚪 API Gateway:      http://localhost:4000"
echo "   🤖 AI-Tutor:        http://localhost:5001"
echo "   🗄️  PostgreSQL:      localhost:5433"
echo "   ⚡ Redis:           localhost:6380"
echo "   🔍 Qdrant:          localhost:6333"
echo ""
echo -e "${BLUE}📖 Documentación API:${NC}"
echo "   📚 API Gateway:      http://localhost:4000/api/v1/info"
echo "   🤖 AI-Tutor Docs:   http://localhost:5001/docs"
echo ""
echo -e "${BLUE}🔧 Comandos útiles:${NC}"
echo "   Validar ecosystem:   ./scripts/validate-ecosystem.sh"
echo "   Ver logs Docker:     docker compose logs -f"
echo "   Detener servicios:   Ctrl+C"
echo ""

# 9. Mantener el script corriendo y mostrar logs básicos
log_info "Servicios activos. Presiona Ctrl+C para detener todo."
log_info "Monitoreando servicios..."

# Loop de monitoreo básico
while true; do
    sleep 30
    
    # Verificar que los procesos siguen activos
    if [[ -f .pids ]]; then
        ACTIVE_PROCESSES=0
        while read pid; do
            if kill -0 $pid 2>/dev/null; then
                ACTIVE_PROCESSES=$((ACTIVE_PROCESSES + 1))
            fi
        done < .pids
        
        if [[ $ACTIVE_PROCESSES -gt 0 ]]; then
            echo -e "${GREEN}$(date '+%H:%M:%S') - $ACTIVE_PROCESSES servicios activos${NC}"
        else
            log_warning "Todos los servicios se han detenido"
            break
        fi
    fi
done

# Si llegamos aquí, algo falló
cleanup