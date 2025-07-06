#!/bin/bash

# 🔍 Adaptive Learning Ecosystem - Validation Script
# EbroValley Digital - ToñoAdPAOS & Claudio Supreme

echo "🎓 Validando Adaptive Learning Ecosystem..."
echo "================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Función para logging
log_check() {
    local status=$1
    local message=$2
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ $message${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ $message${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  $message${NC}"
    else
        echo -e "${BLUE}ℹ️  $message${NC}"
    fi
}

# 1. Validar estructura de directorios
echo -e "${BLUE}📁 Verificando estructura de directorios...${NC}"

if [[ -d "api-gateway" && -d "services" && -d "frontend" && -d "database" ]]; then
    log_check "PASS" "Estructura base de directorios"
else
    log_check "FAIL" "Estructura base de directorios incompleta"
fi

if [[ -d "services/ai-tutor" && -d "services/content-management" && -d "services/progress-tracking" ]]; then
    log_check "PASS" "Directorios de microservicios"
else
    log_check "FAIL" "Directorios de microservicios incompletos"
fi

# 2. Validar archivos de configuración principales
echo -e "${BLUE}⚙️ Verificando archivos de configuración...${NC}"

if [[ -f "package.json" && -f "docker-compose.yml" ]]; then
    log_check "PASS" "Archivos de configuración raíz"
else
    log_check "FAIL" "Archivos de configuración raíz faltantes"
fi

if [[ -f "database/init/01-education-schema.sql" ]]; then
    log_check "PASS" "Schema de base de datos educativa"
else
    log_check "FAIL" "Schema de base de datos faltante"
fi

# 3. Validar API Gateway
echo -e "${BLUE}🚪 Validando API Gateway...${NC}"

if [[ -f "api-gateway/package.json" && -f "api-gateway/src/main.ts" ]]; then
    log_check "PASS" "Archivos base API Gateway"
else
    log_check "FAIL" "Archivos base API Gateway faltantes"
fi

# Verificar compilación TypeScript
if [[ -f "api-gateway/tsconfig.json" ]]; then
    cd api-gateway
    if command -v npm >/dev/null 2>&1; then
        if npm list typescript >/dev/null 2>&1 || npm list -g typescript >/dev/null 2>&1; then
            if npx tsc --noEmit >/dev/null 2>&1; then
                log_check "PASS" "API Gateway compila sin errores"
            else
                log_check "FAIL" "API Gateway tiene errores de compilación"
            fi
        else
            log_check "WARN" "TypeScript no instalado, saltando validación compilación"
        fi
    else
        log_check "WARN" "npm no disponible, saltando validación compilación"
    fi
    cd ..
else
    log_check "FAIL" "tsconfig.json no encontrado en API Gateway"
fi

# 4. Validar AI-Tutor Service
echo -e "${BLUE}🤖 Validando AI-Tutor Service...${NC}"

if [[ -f "services/ai-tutor/app/main.py" && -f "services/ai-tutor/requirements.txt" ]]; then
    log_check "PASS" "Archivos base AI-Tutor Service"
else
    log_check "FAIL" "Archivos base AI-Tutor Service faltantes"
fi

# Verificar sintaxis Python
if command -v python3 >/dev/null 2>&1; then
    if python3 -m py_compile services/ai-tutor/app/main.py >/dev/null 2>&1; then
        log_check "PASS" "AI-Tutor Service sintaxis Python válida"
    else
        log_check "FAIL" "AI-Tutor Service tiene errores de sintaxis Python"
    fi
else
    log_check "WARN" "Python3 no disponible, saltando validación sintaxis"
fi

# 5. Validar configuración de base de datos
echo -e "${BLUE}🗄️ Validando configuración de base de datos...${NC}"

if grep -q "adaptive_learning" database/init/01-education-schema.sql >/dev/null 2>&1; then
    log_check "PASS" "Schema contiene database adaptive_learning"
else
    log_check "FAIL" "Schema no contiene database adaptive_learning"
fi

if grep -q "education.users" database/init/01-education-schema.sql >/dev/null 2>&1; then
    log_check "PASS" "Tabla usuarios definida en schema"
else
    log_check "FAIL" "Tabla usuarios no encontrada en schema"
fi

if grep -q "education.courses" database/init/01-education-schema.sql >/dev/null 2>&1; then
    log_check "PASS" "Tabla cursos definida en schema"
else
    log_check "FAIL" "Tabla cursos no encontrada en schema"
fi

# 6. Validar WebSocket configuration
echo -e "${BLUE}🔄 Validando configuración real-time...${NC}"

if [[ -f "api-gateway/src/realtime/realtime.gateway.ts" ]]; then
    if grep -q "WebSocketGateway" api-gateway/src/realtime/realtime.gateway.ts >/dev/null 2>&1; then
        log_check "PASS" "WebSocket Gateway configurado"
    else
        log_check "FAIL" "WebSocket Gateway mal configurado"
    fi
else
    log_check "FAIL" "WebSocket Gateway no encontrado"
fi

# 7. Validar scripts de automatización
echo -e "${BLUE}🔧 Validando scripts de automatización...${NC}"

if [[ -f "scripts/validate-ecosystem.sh" ]]; then
    if [[ -x "scripts/validate-ecosystem.sh" ]]; then
        log_check "PASS" "Script de validación ejecutable"
    else
        log_check "WARN" "Script de validación no es ejecutable"
    fi
else
    log_check "FAIL" "Script de validación no encontrado"
fi

# 8. Validar configuración Docker
echo -e "${BLUE}🐳 Validando configuración Docker...${NC}"

if grep -q "postgres-education" docker-compose.yml >/dev/null 2>&1; then
    log_check "PASS" "PostgreSQL configurado en Docker Compose"
else
    log_check "FAIL" "PostgreSQL no configurado en Docker Compose"
fi

if grep -q "redis-education" docker-compose.yml >/dev/null 2>&1; then
    log_check "PASS" "Redis configurado en Docker Compose"
else
    log_check "FAIL" "Redis no configurado en Docker Compose"
fi

if grep -q "qdrant" docker-compose.yml >/dev/null 2>&1; then
    log_check "PASS" "Vector database Qdrant configurado"
else
    log_check "FAIL" "Vector database Qdrant no configurado"
fi

# 9. Validar configuración de puertos
echo -e "${BLUE}🔌 Validando configuración de puertos...${NC}"

if grep -q "4000" api-gateway/src/main.ts >/dev/null 2>&1; then
    log_check "PASS" "API Gateway configurado en puerto 4000"
else
    log_check "FAIL" "API Gateway puerto 4000 no configurado"
fi

if grep -q "5001" services/ai-tutor/app/main.py >/dev/null 2>&1; then
    log_check "PASS" "AI-Tutor Service configurado en puerto 5001"
else
    log_check "FAIL" "AI-Tutor Service puerto 5001 no configurado"
fi

# 10. Resumen final
echo ""
echo "================================================"
echo -e "${BLUE}📊 RESUMEN DE VALIDACIÓN${NC}"
echo "================================================"
echo -e "Total de verificaciones: ${TOTAL_CHECKS}"
echo -e "${GREEN}Pasaron: ${PASSED_CHECKS}${NC}"
echo -e "${RED}Fallaron: ${FAILED_CHECKS}${NC}"
echo -e "Porcentaje de éxito: $(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))%"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ¡TODOS LOS CHECKS PASARON!${NC}"
    echo -e "${GREEN}✅ Adaptive Learning Ecosystem listo para desarrollo${NC}"
    echo ""
    echo -e "${BLUE}🚀 Próximos pasos:${NC}"
    echo "   1. Instalar dependencias: npm install en api-gateway/"
    echo "   2. Instalar dependencias Python: pip install -r services/ai-tutor/requirements.txt"
    echo "   3. Iniciar servicios: ./scripts/start-ecosystem.sh"
    exit 0
else
    echo ""
    echo -e "${RED}❌ ALGUNOS CHECKS FALLARON${NC}"
    echo -e "${YELLOW}⚠️  Revisa los errores antes de continuar${NC}"
    exit 1
fi