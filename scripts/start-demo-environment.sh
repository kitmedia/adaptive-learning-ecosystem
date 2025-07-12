#!/bin/bash

# 🚀 Adaptive Learning Ecosystem - Demo Environment Launcher
# Script para lanzar entorno demo comercial completo

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner del sistema
print_banner() {
    echo -e "${PURPLE}"
    echo "═══════════════════════════════════════════════════════════════"
    echo "🚀 ADAPTIVE LEARNING ECOSYSTEM - DEMO ENVIRONMENT"
    echo "🎯 Entorno comercial optimizado para demostraciones de ventas"
    echo "═══════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

# Función de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar prerrequisitos
check_prerequisites() {
    log_info "Verificando prerrequisitos del sistema..."
    
    # Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker no está instalado"
        echo "Instalar Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose no está instalado"
        echo "Instalar Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Verificar puertos
    REQUIRED_PORTS=(3000 8000 8001 8002 8003 8004 8005 6379 9090 3001)
    for port in "${REQUIRED_PORTS[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "Puerto $port ya está en uso"
        fi
    done
    
    log_success "Prerrequisitos verificados"
}

# Limpiar entorno previo
cleanup_previous() {
    log_info "Limpiando entorno demo previo..."
    
    # Detener contenedores demo si existen
    docker-compose -f docker-compose.demo.yml down --remove-orphans 2>/dev/null || true
    
    # Limpiar volúmenes demo
    docker volume rm \
        adaptive-learning-ecosystem_redis-demo-data \
        adaptive-learning-ecosystem_prometheus-demo-data \
        adaptive-learning-ecosystem_grafana-demo-data \
        adaptive-learning-ecosystem_demo-database \
        2>/dev/null || true
    
    log_success "Entorno previo limpiado"
}

# Construir imágenes demo
build_demo_images() {
    log_info "Construyendo imágenes Docker optimizadas para demo..."
    
    # Build de todas las imágenes en paralelo
    docker-compose -f docker-compose.demo.yml build --parallel
    
    log_success "Imágenes demo construidas exitosamente"
}

# Iniciar servicios demo
start_demo_services() {
    log_info "Iniciando servicios del entorno demo..."
    
    # Iniciar servicios de infraestructura primero
    log_info "Iniciando Redis y base de datos..."
    docker-compose -f docker-compose.demo.yml up -d redis-demo
    
    # Esperar que Redis esté listo
    sleep 5
    
    # Inicializar datos demo
    log_info "Inicializando datos demo comerciales..."
    docker-compose -f docker-compose.demo.yml up demo-initializer
    
    # Iniciar servicios principales
    log_info "Iniciando microservicios principales..."
    docker-compose -f docker-compose.demo.yml up -d \
        api-gateway \
        ai-tutor \
        analytics \
        assessment \
        content-management \
        progress-tracking
    
    # Esperar que los servicios estén listos
    sleep 10
    
    # Iniciar frontend
    log_info "Iniciando frontend y dashboard..."
    docker-compose -f docker-compose.demo.yml up -d frontend
    
    # Iniciar monitoreo
    log_info "Iniciando stack de monitoreo..."
    docker-compose -f docker-compose.demo.yml up -d prometheus-demo grafana-demo
    
    log_success "Todos los servicios demo iniciados"
}

# Verificar salud de servicios
health_check() {
    log_info "Verificando salud de los servicios..."
    
    SERVICES=(
        "http://localhost:8000/health|API Gateway"
        "http://localhost:8001/health|AI Tutor"
        "http://localhost:8002/health|Analytics"
        "http://localhost:8003/health|Assessment"
        "http://localhost:8004/health|Content Management"
        "http://localhost:8005/health|Progress Tracking"
        "http://localhost:3000|Frontend"
        "http://localhost:9090|Prometheus"
        "http://localhost:3001|Grafana"
    )
    
    for service in "${SERVICES[@]}"; do
        IFS='|' read -r url name <<< "$service"
        
        if curl -sf "$url" > /dev/null 2>&1; then
            log_success "$name está funcionando"
        else
            log_warning "$name no responde (puede estar iniciando...)"
        fi
    done
}

# Mostrar información de acceso
show_access_info() {
    echo -e "${CYAN}"
    echo "═══════════════════════════════════════════════════════════════"
    echo "🎯 ENTORNO DEMO LISTO - INFORMACIÓN DE ACCESO"
    echo "═══════════════════════════════════════════════════════════════"
    echo -e "${NC}"
    
    echo -e "${GREEN}📊 DASHBOARDS PRINCIPALES:${NC}"
    echo "  🎛️  Admin Dashboard:    http://localhost:3000/admin"
    echo "  👨‍🎓 Student Portal:      http://localhost:3000"
    echo "  📈 Grafana Monitoring:  http://localhost:3001"
    echo "  🔧 API Documentation:   http://localhost:8000/docs"
    echo ""
    
    echo -e "${GREEN}🔑 CREDENCIALES DEMO:${NC}"
    echo "  👑 Admin Universidad:   admin@demo.com / AdminDemo2024!"
    echo "  👨‍🏫 Instructor:          instructor@demo.com / InstructorDemo2024!"
    echo "  👨‍🎓 Estudiante:          student@demo.com / StudentDemo2024!"
    echo ""
    echo "  👑 Admin TechCorp:       admin@techcorp.com / TechAdmin2024!"
    echo "  👑 Admin Bootcamp:       admin@codebootcamp.io / BootAdmin2024!"
    echo ""
    
    echo -e "${GREEN}🏢 ORGANIZACIONES DEMO:${NC}"
    echo "  🎓 Demo University:      2,500 usuarios (Enterprise)"
    echo "  🏢 TechCorp Training:    850 usuarios (Professional)"
    echo "  💻 CodeBootcamp Pro:     120 usuarios (Starter)"
    echo ""
    
    echo -e "${GREEN}📈 MÉTRICAS DEMOSTRACIÓN:${NC}"
    echo "  📊 Completion Rate:      87.3% promedio"
    echo "  ⭐ Engagement Score:     8.4/10"
    echo "  🕒 Learning Hours:       12,450 horas totales"
    echo "  🤖 AI Interactions:      400+ interacciones"
    echo ""
    
    echo -e "${YELLOW}🎬 GUIONES DE DEMO RECOMENDADOS:${NC}"
    echo "  1. Admin Dashboard Tour (5 min)"
    echo "  2. Student Experience (3 min)"
    echo "  3. Instructor Tools (4 min)"
    echo "  4. Business Intelligence (6 min)"
    echo ""
    
    echo -e "${PURPLE}🛠️  COMANDOS ÚTILES:${NC}"
    echo "  📊 Ver logs:             docker-compose -f docker-compose.demo.yml logs -f"
    echo "  🔄 Reiniciar demo:       ./scripts/start-demo-environment.sh"
    echo "  🛑 Detener demo:         docker-compose -f docker-compose.demo.yml down"
    echo "  📈 Monitor recursos:     docker stats"
    
    echo -e "${CYAN}"
    echo "═══════════════════════════════════════════════════════════════"
    echo "🚀 ENTORNO DEMO LISTO PARA COMERCIALIZACIÓN"
    echo "═══════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

# Función principal
main() {
    print_banner
    
    log_info "Iniciando configuración del entorno demo comercial..."
    
    # Verificar que estamos en el directorio correcto
    if [[ ! -f "docker-compose.demo.yml" ]]; then
        log_error "No se encontró docker-compose.demo.yml"
        log_error "Ejecutar desde el directorio raíz del proyecto"
        exit 1
    fi
    
    # Ejecutar pasos de configuración
    check_prerequisites
    cleanup_previous
    build_demo_images
    start_demo_services
    
    # Esperar que todos los servicios estén completamente listos
    log_info "Esperando que todos los servicios estén completamente operativos..."
    sleep 30
    
    health_check
    show_access_info
    
    log_success "¡Entorno demo listo para demostraciones comerciales!"
}

# Manejar interrupciones
trap 'log_warning "Script interrumpido por el usuario"; exit 1' INT

# Ejecutar función principal
main "$@"