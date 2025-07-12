#!/usr/bin/env python3
"""
Multi-Tenant Authentication Routes
Adaptive Learning Ecosystem - EbroValley Digital

Rutas de autenticación empresarial con soporte completo multi-tenant
"""

from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from fastapi.security import HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime
import hashlib
import uuid
import sqlite3

from .auth_middleware import (
    auth_service, 
    get_current_user, 
    get_current_tenant,
    require_permission,
    require_role,
    rate_limit,
    UserClaims,
    TenantConfig,
    AuthenticationResult
)

logger = logging.getLogger(__name__)

# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class LoginRequest(BaseModel):
    """Request para login"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    tenant_domain: Optional[str] = None
    remember_me: bool = False

class LoginResponse(BaseModel):
    """Response de login exitoso"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user_info: Dict[str, Any]
    tenant_info: Dict[str, Any]
    permissions: List[str]

class RefreshTokenRequest(BaseModel):
    """Request para refresh token"""
    refresh_token: str

class RegisterRequest(BaseModel):
    """Request para registro de usuario"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    tenant_domain: Optional[str] = None
    role: str = "student"
    invitation_code: Optional[str] = None

class TenantRegistrationRequest(BaseModel):
    """Request para registro de nuevo tenant"""
    organization_name: str = Field(..., min_length=3, max_length=100)
    domain: str = Field(..., min_length=3, max_length=50)
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=8)
    admin_first_name: str = Field(..., min_length=2, max_length=50)
    admin_last_name: str = Field(..., min_length=2, max_length=50)
    organization_type: str = Field(default="corporate", regex="^(university|school|corporate|bootcamp)$")
    subscription_plan: str = Field(default="starter", regex="^(starter|professional|enterprise)$")

class PasswordChangeRequest(BaseModel):
    """Request para cambio de contraseña"""
    current_password: str
    new_password: str = Field(..., min_length=8)

class TenantUpdateRequest(BaseModel):
    """Request para actualizar configuración de tenant"""
    name: Optional[str] = None
    max_users: Optional[int] = None
    features: Optional[List[str]] = None
    rate_limits: Optional[Dict[str, int]] = None
    security_settings: Optional[Dict[str, Any]] = None

# =============================================================================
# AUTHENTICATION ROUTER
# =============================================================================

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    background_tasks: BackgroundTasks,
    http_request: Request,
    _rate_limit: dict = Depends(rate_limit(10))  # 10 intentos por minuto
):
    """
    Autenticación de usuario con soporte multi-tenant
    
    - Soporta login con dominio específico o auto-detección
    - Rate limiting por IP
    - Logging de seguridad completo
    - Tokens JWT con claims extendidos
    """
    
    # Get client info for logging
    client_ip = http_request.client.host
    user_agent = http_request.headers.get("user-agent", "unknown")
    
    # Authenticate user
    auth_result = await auth_service.authenticate_user(
        email=request.email,
        password=request.password,
        tenant_domain=request.tenant_domain
    )
    
    if not auth_result.success:
        # Log failed attempt
        background_tasks.add_task(
            auth_service._log_security_event,
            "failed_login_attempt",
            ip_address=client_ip,
            user_agent=user_agent,
            details={
                "email": request.email,
                "tenant_domain": request.tenant_domain,
                "error": auth_result.error_message
            },
            severity="warning"
        )
        
        raise HTTPException(
            status_code=401,
            detail=auth_result.error_message or "Authentication failed"
        )
    
    # Get tenant info
    tenant_config = await auth_service.get_tenant_config(auth_result.user_claims.tenant_id)
    
    return LoginResponse(
        access_token=auth_result.token,
        refresh_token=auth_result.refresh_token,
        expires_in=auth_service.access_token_expire_minutes * 60,
        user_info={
            "id": auth_result.user_claims.user_id,
            "email": auth_result.user_claims.email,
            "role": auth_result.user_claims.role,
            "tenant_id": auth_result.user_claims.tenant_id
        },
        tenant_info={
            "id": tenant_config.tenant_id,
            "name": tenant_config.name,
            "domain": tenant_config.domain,
            "subscription_plan": tenant_config.subscription_plan,
            "features": tenant_config.features
        },
        permissions=auth_result.user_claims.permissions
    )

@router.post("/refresh")
async def refresh_token(
    request: RefreshTokenRequest,
    _rate_limit: dict = Depends(rate_limit(20))  # 20 refresh por minuto
):
    """
    Refresh access token usando refresh token
    """
    try:
        # Verify refresh token
        import jwt
        payload = jwt.decode(
            request.refresh_token, 
            auth_service.jwt_secret, 
            algorithms=[auth_service.jwt_algorithm]
        )
        
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        # Create new access token
        access_token, claims = await auth_service.create_access_token(
            payload["user_id"], 
            payload["tenant_id"]
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": auth_service.access_token_expire_minutes * 60
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/logout")
async def logout(
    current_user: UserClaims = Depends(get_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Logout y invalidación de sesión
    """
    
    # Invalidate session in Redis
    if auth_service.redis_client:
        session_key = f"auth:session:{current_user.session_id}"
        await auth_service.redis_client.delete(session_key)
    
    # Log logout
    background_tasks.add_task(
        auth_service._log_security_event,
        "user_logout",
        user_id=current_user.user_id,
        tenant_id=current_user.tenant_id,
        details={"email": current_user.email},
        severity="info"
    )
    
    return {"message": "Successfully logged out"}

@router.get("/me")
async def get_current_user_info(
    current_user: UserClaims = Depends(get_current_user),
    tenant_config: TenantConfig = Depends(get_current_tenant)
):
    """
    Obtener información del usuario actual
    """
    return {
        "user": {
            "id": current_user.user_id,
            "email": current_user.email,
            "role": current_user.role,
            "permissions": current_user.permissions,
            "session_id": current_user.session_id
        },
        "tenant": {
            "id": tenant_config.tenant_id,
            "name": tenant_config.name,
            "domain": tenant_config.domain,
            "subscription_plan": tenant_config.subscription_plan,
            "features": tenant_config.features
        }
    }

# =============================================================================
# USER MANAGEMENT
# =============================================================================

@router.post("/register")
async def register_user(
    request: RegisterRequest,
    background_tasks: BackgroundTasks,
    _rate_limit: dict = Depends(rate_limit(5))  # 5 registros por minuto
):
    """
    Registro de nuevo usuario en tenant existente
    """
    
    # Validate tenant
    tenant_config = None
    if request.tenant_domain:
        tenant_config = await auth_service.get_tenant_by_domain(request.tenant_domain)
        if not tenant_config:
            raise HTTPException(status_code=404, detail="Invalid tenant domain")
    
    # Check if user already exists
    conn = sqlite3.connect(auth_service.db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM users WHERE email = ?", (request.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="User already exists")
    
    # Create user
    user_id = str(uuid.uuid4())
    password_hash = hashlib.sha256(request.password.encode()).hexdigest()
    
    cursor.execute("""
        INSERT INTO users (
            id, email, password_hash, first_name, last_name, 
            role, institution_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id, request.email, password_hash, request.first_name, 
        request.last_name, request.role, 
        tenant_config.tenant_id if tenant_config else None,
        datetime.utcnow().isoformat(),
        datetime.utcnow().isoformat()
    ))
    
    conn.commit()
    conn.close()
    
    # Log registration
    background_tasks.add_task(
        auth_service._log_security_event,
        "user_registered",
        user_id=user_id,
        tenant_id=tenant_config.tenant_id if tenant_config else None,
        details={
            "email": request.email,
            "role": request.role,
            "tenant_domain": request.tenant_domain
        },
        severity="info"
    )
    
    return {
        "message": "User registered successfully",
        "user_id": user_id,
        "email": request.email
    }

@router.post("/change-password")
async def change_password(
    request: PasswordChangeRequest,
    current_user: UserClaims = Depends(get_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Cambiar contraseña del usuario actual
    """
    
    # Verify current password
    conn = sqlite3.connect(auth_service.db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT password_hash FROM users WHERE id = ?", (current_user.user_id,))
    row = cursor.fetchone()
    
    if not row or not auth_service._verify_password(request.current_password, row[0]):
        conn.close()
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # Update password
    new_password_hash = hashlib.sha256(request.new_password.encode()).hexdigest()
    cursor.execute(
        "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
        (new_password_hash, datetime.utcnow().isoformat(), current_user.user_id)
    )
    
    conn.commit()
    conn.close()
    
    # Log password change
    background_tasks.add_task(
        auth_service._log_security_event,
        "password_changed",
        user_id=current_user.user_id,
        tenant_id=current_user.tenant_id,
        details={"email": current_user.email},
        severity="info"
    )
    
    return {"message": "Password changed successfully"}

# =============================================================================
# TENANT MANAGEMENT
# =============================================================================

@router.post("/tenant/register")
async def register_tenant(
    request: TenantRegistrationRequest,
    background_tasks: BackgroundTasks,
    _rate_limit: dict = Depends(rate_limit(2))  # 2 registros de tenant por minuto
):
    """
    Registro de nueva organización/tenant
    """
    
    conn = sqlite3.connect(auth_service.db_path)
    cursor = conn.cursor()
    
    # Check if domain already exists
    cursor.execute("SELECT id FROM institutions WHERE domain = ?", (request.domain,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="Domain already exists")
    
    # Check if admin email already exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (request.admin_email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="Admin email already exists")
    
    # Create tenant
    tenant_id = str(uuid.uuid4())
    
    # Determine max students by plan
    max_students_by_plan = {
        "starter": 100,
        "professional": 1000,
        "enterprise": 10000
    }
    max_students = max_students_by_plan.get(request.subscription_plan, 100)
    
    # Default features by plan
    features_by_plan = {
        "starter": ["basic_learning", "progress_tracking"],
        "professional": ["basic_learning", "progress_tracking", "analytics", "ai_tutor"],
        "enterprise": ["basic_learning", "progress_tracking", "analytics", "ai_tutor", "advanced_security", "custom_branding"]
    }
    features = features_by_plan.get(request.subscription_plan, ["basic_learning"])
    
    settings = {
        "features": features,
        "rate_limits": {
            "api_calls_per_minute": 1000,
            "ai_requests_per_hour": 100 if request.subscription_plan == "starter" else 500
        },
        "security": {
            "require_2fa": request.subscription_plan == "enterprise",
            "password_policy": "strict" if request.subscription_plan == "enterprise" else "standard",
            "session_timeout_minutes": 60
        }
    }
    
    cursor.execute("""
        INSERT INTO institutions (
            id, name, domain, type, subscription_plan, max_students, 
            settings, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tenant_id, request.organization_name, request.domain, 
        request.organization_type, request.subscription_plan, max_students,
        str(settings), datetime.utcnow().isoformat()
    ))
    
    # Create admin user
    admin_id = str(uuid.uuid4())
    admin_password_hash = hashlib.sha256(request.admin_password.encode()).hexdigest()
    
    cursor.execute("""
        INSERT INTO users (
            id, email, password_hash, first_name, last_name, 
            role, institution_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        admin_id, request.admin_email, admin_password_hash, 
        request.admin_first_name, request.admin_last_name, 
        "institution_admin", tenant_id,
        datetime.utcnow().isoformat(), datetime.utcnow().isoformat()
    ))
    
    conn.commit()
    conn.close()
    
    # Clear tenant cache
    if tenant_id in auth_service.tenant_cache:
        del auth_service.tenant_cache[tenant_id]
    
    # Log tenant creation
    background_tasks.add_task(
        auth_service._log_security_event,
        "tenant_created",
        user_id=admin_id,
        tenant_id=tenant_id,
        details={
            "organization_name": request.organization_name,
            "domain": request.domain,
            "subscription_plan": request.subscription_plan,
            "admin_email": request.admin_email
        },
        severity="info"
    )
    
    return {
        "message": "Tenant registered successfully",
        "tenant_id": tenant_id,
        "domain": request.domain,
        "admin_user_id": admin_id
    }

@router.get("/tenant/config")
async def get_tenant_config(
    current_user: UserClaims = Depends(get_current_user),
    tenant_config: TenantConfig = Depends(get_current_tenant)
):
    """
    Obtener configuración completa del tenant actual
    """
    return {
        "tenant_id": tenant_config.tenant_id,
        "name": tenant_config.name,
        "domain": tenant_config.domain,
        "subscription_plan": tenant_config.subscription_plan,
        "max_users": tenant_config.max_users,
        "features": tenant_config.features,
        "rate_limits": tenant_config.rate_limits,
        "security_settings": tenant_config.security_settings,
        "created_at": tenant_config.created_at,
        "is_active": tenant_config.is_active
    }

@router.put("/tenant/config")
async def update_tenant_config(
    request: TenantUpdateRequest,
    current_user: UserClaims = Depends(require_role(["institution_admin"])),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Actualizar configuración del tenant (solo admins)
    """
    
    updates = {}
    if request.name is not None:
        updates["name"] = request.name
    if request.max_users is not None:
        updates["max_students"] = request.max_users
    
    # Update settings
    current_settings = {}
    if request.features or request.rate_limits or request.security_settings:
        conn = sqlite3.connect(auth_service.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT settings FROM institutions WHERE id = ?", (current_user.tenant_id,))
        row = cursor.fetchone()
        if row and row[0]:
            import json
            current_settings = json.loads(row[0])
        
        if request.features:
            current_settings["features"] = request.features
        if request.rate_limits:
            current_settings["rate_limits"] = request.rate_limits
        if request.security_settings:
            current_settings["security"] = request.security_settings
        
        updates["settings"] = json.dumps(current_settings)
        
        # Apply updates
        if updates:
            update_query = "UPDATE institutions SET "
            update_query += ", ".join([f"{k} = ?" for k in updates.keys()])
            update_query += ", updated_at = ? WHERE id = ?"
            
            cursor.execute(
                update_query,
                list(updates.values()) + [datetime.utcnow().isoformat(), current_user.tenant_id]
            )
            
            conn.commit()
        
        conn.close()
    
    # Clear cache
    if current_user.tenant_id in auth_service.tenant_cache:
        del auth_service.tenant_cache[current_user.tenant_id]
    
    # Log configuration change
    background_tasks.add_task(
        auth_service._log_security_event,
        "tenant_config_updated",
        user_id=current_user.user_id,
        tenant_id=current_user.tenant_id,
        details={"changes": updates},
        severity="info"
    )
    
    return {"message": "Tenant configuration updated successfully"}

# =============================================================================
# HEALTH AND MONITORING
# =============================================================================

@router.get("/health")
async def auth_health_check():
    """
    Health check para el sistema de autenticación
    """
    
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {}
    }
    
    # Check database
    try:
        conn = sqlite3.connect(auth_service.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users LIMIT 1")
        cursor.fetchone()
        conn.close()
        health_status["services"]["database"] = "healthy"
    except Exception as e:
        health_status["services"]["database"] = f"unhealthy: {e}"
        health_status["status"] = "degraded"
    
    # Check Redis
    try:
        if auth_service.redis_client:
            await auth_service.redis_client.ping()
            health_status["services"]["redis"] = "healthy"
        else:
            health_status["services"]["redis"] = "not_configured"
    except Exception as e:
        health_status["services"]["redis"] = f"unhealthy: {e}"
        health_status["status"] = "degraded"
    
    return health_status

@router.get("/stats")
async def get_auth_stats(
    current_user: UserClaims = Depends(require_role(["admin", "institution_admin"]))
):
    """
    Estadísticas del sistema de autenticación (solo admins)
    """
    
    conn = sqlite3.connect(auth_service.db_path)
    cursor = conn.cursor()
    
    # Users by tenant
    cursor.execute("""
        SELECT institution_id, role, COUNT(*) as count
        FROM users 
        WHERE institution_id = ? AND is_active = 1
        GROUP BY institution_id, role
    """, (current_user.tenant_id,))
    
    user_stats = {}
    for row in cursor.fetchall():
        tenant_id, role, count = row
        if tenant_id not in user_stats:
            user_stats[tenant_id] = {}
        user_stats[tenant_id][role] = count
    
    # Active sessions (from Redis)
    active_sessions = 0
    if auth_service.redis_client:
        try:
            session_keys = await auth_service.redis_client.keys("auth:session:*")
            active_sessions = len(session_keys)
        except:
            pass
    
    conn.close()
    
    return {
        "tenant_id": current_user.tenant_id,
        "user_stats": user_stats.get(current_user.tenant_id, {}),
        "active_sessions": active_sessions,
        "timestamp": datetime.utcnow().isoformat()
    }

# Export router
auth_router = router