# 🚀 DEVELOPER ONBOARDING GUIDE
## Adaptive Learning Ecosystem - EbroValley Digital

**Bienvenido al equipo!** Este documento te guiará paso a paso para configurar tu entorno de desarrollo en menos de 2 horas.

---

## 📋 TABLA DE CONTENIDOS

1. [Prerequisites](#-prerequisites)
2. [Quick Setup (15 minutos)](#-quick-setup)
3. [Architecture Overview](#-architecture-overview)
4. [Development Workflow](#-development-workflow)
5. [Common Tasks](#-common-tasks)
6. [Troubleshooting](#-troubleshooting)
7. [Contributing Guidelines](#-contributing-guidelines)

---

## 🛠️ PREREQUISITES

### Software Requerido

| Software | Versión Mínima | Instalación |
|----------|----------------|-------------|
| **Node.js** | 20.x | `curl -fsSL https://deb.nodesource.com/setup_20.x \| sudo -E bash -` |
| **Python** | 3.11+ | `sudo apt install python3.11 python3.11-pip` |
| **Docker** | 24.x | `sudo apt install docker.io docker-compose` |
| **Git** | 2.30+ | `sudo apt install git` |
| **VS Code** | Latest | [Download](https://code.visualstudio.com/) |

### Verificación Rápida
```bash
# Ejecuta este comando para verificar todo
node --version && python3 --version && docker --version && git --version
```

### Hardware Recomendado
- **RAM**: 8GB mínimo (16GB recomendado)
- **CPU**: 4 cores mínimo
- **Disco**: 50GB libres
- **OS**: Ubuntu 22.04 / macOS 13+ / Windows 11 con WSL2

---

## 🚀 QUICK SETUP

### Opción A: Setup Automático (Recomendado)
```bash
# 1. Clonar repositorio
git clone https://github.com/ebrovalley/adaptive-learning-ecosystem.git
cd adaptive-learning-ecosystem

# 2. Ejecutar script de setup automático
./scripts/dev-setup.sh

# 3. Iniciar todos los servicios
./scripts/start-ecosystem.sh
```

### Opción B: Setup Manual

#### Paso 1: Clonar y Configurar
```bash
# Clonar repositorio
git clone https://github.com/ebrovalley/adaptive-learning-ecosystem.git
cd adaptive-learning-ecosystem

# Copiar archivos de configuración
cp .env.example .env.development
```

#### Paso 2: Instalar Dependencias

**API Gateway (NestJS)**:
```bash
cd api-gateway
npm install
cd ..
```

**Frontend (React + Vite)**:
```bash
cd frontend
npm install
cd ..
```

**Microservicios Python**:
```bash
# AI-Tutor Service
cd services/ai-tutor
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ../..

# Progress Tracking Service
cd services/progress-tracking
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ../..

# Assessment Service
cd services/assessment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ../..
```

#### Paso 3: Configurar Base de Datos
```bash
# Iniciar PostgreSQL y Redis con Docker
docker-compose up -d postgres redis

# Esperar 10 segundos para que inicien
sleep 10

# Ejecutar migraciones
cd database
python3 postgresql_setup.py
cd ..
```

#### Paso 4: Variables de Entorno

Edita `.env.development` con estos valores mínimos:
```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=adaptive_learning
POSTGRES_USER=adaptive_user
POSTGRES_PASSWORD=adaptive_password_2024

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=dev_jwt_secret_2024
JWT_REFRESH_SECRET=dev_refresh_secret_2024

# Services
AI_TUTOR_PORT=5001
PROGRESS_TRACKING_PORT=5004
ASSESSMENT_PORT=5005
API_GATEWAY_PORT=4000
FRONTEND_PORT=3000
```

---

## 🏗️ ARCHITECTURE OVERVIEW

### Sistema de Microservicios
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   API Gateway   │────▶│  Microservices  │
│  (React+Vite)   │     │    (NestJS)     │     │   (FastAPI)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                        │
        └────────────────────────┴────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │      PostgreSQL         │
                    │        Redis            │
                    └─────────────────────────┘
```

### Puertos de Servicios
| Servicio | Puerto | URL |
|----------|--------|-----|
| **Frontend** | 3000 | http://localhost:3000 |
| **API Gateway** | 4000 | http://localhost:4000/api/v1 |
| **Swagger Docs** | 4000 | http://localhost:4000/docs |
| **AI-Tutor** | 5001 | http://localhost:5001 |
| **Progress** | 5004 | http://localhost:5004 |
| **Assessment** | 5005 | http://localhost:5005 |
| **PostgreSQL** | 5432 | localhost:5432 |
| **Redis** | 6379 | localhost:6379 |

---

## 💻 DEVELOPMENT WORKFLOW

### 1. Iniciar Entorno de Desarrollo

**Todos los servicios**:
```bash
# Desde la raíz del proyecto
npm run dev
```

**Servicios individuales**:
```bash
# Terminal 1: API Gateway
cd api-gateway && npm run start:dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: AI-Tutor
cd services/ai-tutor && python main.py

# Terminal 4: Progress Tracking
cd services/progress-tracking && python main.py

# Terminal 5: Assessment
cd services/assessment && python main.py
```

### 2. Estructura de Branches

```bash
main
├── develop
│   ├── feature/new-feature
│   ├── bugfix/issue-123
│   └── hotfix/critical-fix
└── release/v1.0.0
```

### 3. Commit Convention

```bash
# Formato
<type>(<scope>): <subject>

# Ejemplos
feat(auth): add JWT refresh token support
fix(ai-tutor): resolve memory leak in ML model
docs(api): update swagger documentation
test(integration): add auth flow tests
```

**Types**:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `test`: Tests
- `refactor`: Refactorización
- `perf`: Mejoras de performance
- `chore`: Tareas de mantenimiento

### 4. Pull Request Process

1. **Crear branch desde develop**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/mi-nueva-funcionalidad
   ```

2. **Desarrollar y testear**:
   ```bash
   # Hacer cambios
   npm run test
   npm run lint
   ```

3. **Commit y push**:
   ```bash
   git add .
   git commit -m "feat(module): add new functionality"
   git push origin feature/mi-nueva-funcionalidad
   ```

4. **Crear Pull Request**:
   - Título descriptivo
   - Descripción detallada
   - Screenshots si es UI
   - Link a issue relacionado

---

## 📝 COMMON TASKS

### Agregar Nueva Ruta API

**1. En API Gateway** (`api-gateway/src/`):
```typescript
// nuevo-module/nuevo.controller.ts
@Controller('nuevo')
export class NuevoController {
  @Get('test')
  test() {
    return { message: 'Hello from nuevo module' };
  }
}
```

**2. Registrar en módulo**:
```typescript
// app.module.ts
imports: [
  // ... otros módulos
  NuevoModule,
]
```

### Agregar Nuevo Microservicio

**1. Crear estructura**:
```bash
mkdir services/nuevo-servicio
cd services/nuevo-servicio
touch main.py requirements.txt Dockerfile
```

**2. Configurar FastAPI**:
```python
# main.py
from fastapi import FastAPI

app = FastAPI(title="Nuevo Servicio")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5006)
```

### Ejecutar Tests

**Tests unitarios**:
```bash
# API Gateway
cd api-gateway && npm run test

# Frontend
cd frontend && npm run test

# Python services
cd services/ai-tutor && python -m pytest
```

**Tests de integración**:
```bash
npm run test:integration
```

**Tests E2E**:
```bash
npm run test:e2e
```

### Debugging

**VS Code Launch Config** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API Gateway",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "cwd": "${workspaceFolder}/api-gateway",
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Python Service",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["main:app", "--reload", "--port", "5001"],
      "cwd": "${workspaceFolder}/services/ai-tutor"
    }
  ]
}
```

---

## 🔧 TROUBLESHOOTING

### Problema: "Cannot connect to PostgreSQL"
```bash
# Solución
docker-compose up -d postgres
docker ps  # Verificar que esté running
docker logs adaptive-postgres  # Ver logs
```

### Problema: "Port already in use"
```bash
# Encontrar proceso usando el puerto
lsof -i :4000  # macOS/Linux
netstat -ano | findstr :4000  # Windows

# Matar proceso
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Problema: "Module not found" en Python
```bash
# Activar virtual environment
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate  # Windows

# Reinstalar dependencias
pip install -r requirements.txt
```

### Problema: "npm install fails"
```bash
# Limpiar cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 🤝 CONTRIBUTING GUIDELINES

### Code Style

**TypeScript/JavaScript**:
- ESLint + Prettier configurados
- Ejecutar `npm run lint:fix` antes de commit

**Python**:
- Black formatter
- Flake8 linter
- Type hints obligatorios

### Testing Requirements

- **Coverage mínimo**: 80%
- **Tests obligatorios** para:
  - Nuevas features
  - Bug fixes
  - Cambios en API

### Review Checklist

- [ ] Tests pasan localmente
- [ ] Documentación actualizada
- [ ] No hay console.logs
- [ ] Variables de entorno documentadas
- [ ] Sin secretos hardcodeados
- [ ] Performance considerada

### Recursos Útiles

- **Documentación API**: http://localhost:4000/docs
- **Architecture Docs**: `/docs/ARCHITECTURE.md`
- **API Reference**: `/docs/API-REFERENCE.md`
- **Database Schema**: `/docs/DATABASE-SCHEMA.md`

---

## 🎯 PRÓXIMOS PASOS

1. **Explora el código**: Revisa la estructura y arquitectura
2. **Ejecuta la aplicación**: Sigue el Quick Setup
3. **Lee la documentación**: Swagger UI y docs/
4. **Únete al equipo**: Slack #adaptive-learning-dev
5. **Contribuye**: Toma un issue de "good first issue"

---

## 📞 SOPORTE

- **Slack**: #adaptive-learning-dev
- **Email**: dev-team@ebrovalley.com
- **Wiki**: https://wiki.ebrovalley.com/adaptive-learning
- **Lead Developer**: Claudio Supreme

---

**Bienvenido al equipo de Adaptive Learning Ecosystem!** 🚀

*Última actualización: 7 de Enero 2025*