#!/usr/bin/env python3
"""
Multi-Tenant Authentication Middleware
Adaptive Learning Ecosystem - EbroValley Digital

Sistema de autenticación empresarial con soporte para múltiples organizaciones
Incluye JWT, RBAC, rate limiting y auditoría completa
"""

import jwt
import asyncio
import hashlib
import sqlite3
import redis.asyncio as redis
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Tuple
from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
import logging
import json
import time
import uuid
from functools import wraps
import secrets

logger = logging.getLogger(__name__)

# =============================================================================
# CONFIGURATION AND MODELS
# =============================================================================

class TenantConfig(BaseModel):
    """Configuración de tenant/organización"""
    tenant_id: str
    name: str
    domain: str
    subscription_plan: str = "starter"
    max_users: int = 100
    features: List[str] = Field(default_factory=list)
    rate_limits: Dict[str, int] = Field(default_factory=dict)
    security_settings: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    is_active: bool = True

class UserClaims(BaseModel):
    """Claims del JWT token"""
    user_id: str
    email: str
    role: str
    tenant_id: str
    tenant_name: str
    permissions: List[str] = Field(default_factory=list)
    session_id: str
    exp: int
    iat: int
    
class AuthenticationResult(BaseModel):
    """Resultado de autenticación"""
    success: bool
    user_claims: Optional[UserClaims] = None
    token: Optional[str] = None
    refresh_token: Optional[str] = None
    error_message: Optional[str] = None
    rate_limit_remaining: Optional[int] = None

class SecurityEvent(BaseModel):
    """Evento de seguridad para auditoría"""
    event_type: str
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    ip_address: str
    user_agent: str
    details: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    severity: str = "info"  # info, warning, critical

# =============================================================================
# MULTI-TENANT AUTHENTICATION SERVICE
# =============================================================================

class MultiTenantAuthService:
    """Servicio de autenticación multi-tenant empresarial"""
    
    def __init__(self, 
                 db_path: str = "database/adaptive_learning.db",
                 redis_url: str = "redis://localhost:6380",
                 jwt_secret: str = None,
                 jwt_algorithm: str = "HS256",
                 access_token_expire_minutes: int = 60,
                 refresh_token_expire_days: int = 30):
        
        self.db_path = db_path
        self.redis_url = redis_url
        self.jwt_secret = jwt_secret or secrets.token_urlsafe(32)
        self.jwt_algorithm = jwt_algorithm
        self.access_token_expire_minutes = access_token_expire_minutes
        self.refresh_token_expire_days = refresh_token_expire_days
        
        # Cache para configuraciones de tenants
        self.tenant_cache: Dict[str, TenantConfig] = {}
        self.permission_cache: Dict[str, List[str]] = {}
        
        # Rate limiting por tenant
        self.rate_limiters: Dict[str, Dict[str, int]] = {}
        
        # Setup Redis connection
        self._setup_redis()
        
    async def _setup_redis(self):
        """Configurar conexión Redis"""
        try:
            self.redis_client = redis.from_url(self.redis_url)
            await self.redis_client.ping()
            logger.info("✅ Redis connection established for auth service")
        except Exception as e:
            logger.error(f"❌ Redis connection failed: {e}")
            self.redis_client = None
    
    # =========================================================================
    # TENANT MANAGEMENT
    # =========================================================================
    
    async def get_tenant_config(self, tenant_id: str) -> Optional[TenantConfig]:
        """Obtener configuración de tenant con cache"""
        
        # Check cache first
        if tenant_id in self.tenant_cache:
            return self.tenant_cache[tenant_id]
        
        # Load from database
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, name, domain, subscription_plan, max_students, 
                       settings, created_at, (is_active IS NULL OR is_active = 1) as is_active
                FROM institutions 
                WHERE id = ?
            """, (tenant_id,))
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                settings = json.loads(row[5]) if row[5] else {}
                
                config = TenantConfig(
                    tenant_id=row[0],
                    name=row[1],
                    domain=row[2],
                    subscription_plan=row[3],
                    max_users=row[4],
                    features=settings.get("features", ["basic_learning", "progress_tracking"]),
                    rate_limits=settings.get("rate_limits", {
                        "api_calls_per_minute": 1000,
                        "ai_requests_per_hour": 100
                    }),
                    security_settings=settings.get("security", {
                        "require_2fa": False,
                        "password_policy": "standard",
                        "session_timeout_minutes": 60
                    }),
                    created_at=datetime.fromisoformat(row[6]),
                    is_active=bool(row[7])
                )
                
                # Cache the config
                self.tenant_cache[tenant_id] = config
                return config
                
        except Exception as e:
            logger.error(f"Error loading tenant config for {tenant_id}: {e}")
        
        return None
    
    async def get_tenant_by_domain(self, domain: str) -> Optional[TenantConfig]:
        """Obtener tenant por dominio"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id FROM institutions 
                WHERE domain = ? AND (is_active IS NULL OR is_active = 1)
            """, (domain,))
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return await self.get_tenant_config(row[0])
                
        except Exception as e:
            logger.error(f"Error finding tenant by domain {domain}: {e}")
        
        return None
    
    # =========================================================================
    # JWT TOKEN MANAGEMENT
    # =========================================================================
    
    async def create_access_token(self, user_id: str, tenant_id: str) -> Tuple[str, UserClaims]:
        """Crear token de acceso JWT con claims completos"""
        
        # Get user info
        user_info = await self._get_user_info(user_id, tenant_id)
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get tenant config
        tenant_config = await self.get_tenant_config(tenant_id)
        if not tenant_config or not tenant_config.is_active:
            raise HTTPException(status_code=404, detail="Invalid or inactive tenant")
        
        # Get user permissions
        permissions = await self._get_user_permissions(user_id, user_info["role"], tenant_id)
        
        # Create session ID
        session_id = str(uuid.uuid4())
        
        # Token expiration
        now = datetime.now(timezone.utc)
        exp = now + timedelta(minutes=self.access_token_expire_minutes)
        
        # Create claims
        claims = UserClaims(
            user_id=user_id,
            email=user_info["email"],
            role=user_info["role"],
            tenant_id=tenant_id,
            tenant_name=tenant_config.name,
            permissions=permissions,
            session_id=session_id,
            exp=int(exp.timestamp()),
            iat=int(now.timestamp())
        )
        
        # Create JWT token
        token_data = claims.dict()
        token = jwt.encode(token_data, self.jwt_secret, algorithm=self.jwt_algorithm)
        
        # Store session in Redis for fast validation
        if self.redis_client:
            session_key = f"auth:session:{session_id}"
            session_data = {
                "user_id": user_id,
                "tenant_id": tenant_id,
                "created_at": now.isoformat(),
                "last_activity": now.isoformat()
            }
            await self.redis_client.setex(
                session_key, 
                self.access_token_expire_minutes * 60, 
                json.dumps(session_data)
            )
        
        return token, claims
    
    async def verify_token(self, token: str) -> Optional[UserClaims]:
        """Verificar y decodificar token JWT"""
        try:
            # Decode JWT
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            claims = UserClaims(**payload)
            
            # Check session in Redis
            if self.redis_client:
                session_key = f"auth:session:{claims.session_id}"
                session_data = await self.redis_client.get(session_key)
                
                if not session_data:
                    raise HTTPException(status_code=401, detail="Session expired")
                
                # Update last activity
                session_info = json.loads(session_data)
                session_info["last_activity"] = datetime.now(timezone.utc).isoformat()
                await self.redis_client.setex(
                    session_key,
                    self.access_token_expire_minutes * 60,
                    json.dumps(session_info)
                )
            
            # Verify tenant is still active
            tenant_config = await self.get_tenant_config(claims.tenant_id)
            if not tenant_config or not tenant_config.is_active:
                raise HTTPException(status_code=401, detail="Tenant inactive")
            
            return claims
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            raise HTTPException(status_code=401, detail="Authentication failed")
    
    # =========================================================================
    # AUTHENTICATION METHODS
    # =========================================================================
    
    async def authenticate_user(self, email: str, password: str, 
                              tenant_domain: Optional[str] = None) -> AuthenticationResult:
        """Autenticar usuario con soporte multi-tenant"""
        
        try:
            # Get tenant if domain provided
            tenant_config = None
            if tenant_domain:
                tenant_config = await self.get_tenant_by_domain(tenant_domain)
                if not tenant_config:
                    return AuthenticationResult(
                        success=False,
                        error_message="Invalid tenant domain"
                    )
            
            # Find user
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            if tenant_config:
                cursor.execute("""
                    SELECT id, email, password_hash, role, institution_id, is_active
                    FROM users 
                    WHERE email = ? AND institution_id = ? AND is_active = 1
                """, (email, tenant_config.tenant_id))
            else:
                cursor.execute("""
                    SELECT id, email, password_hash, role, institution_id, is_active
                    FROM users 
                    WHERE email = ? AND is_active = 1
                """, (email,))
            
            user_row = cursor.fetchone()
            conn.close()
            
            if not user_row:
                return AuthenticationResult(
                    success=False,
                    error_message="Invalid credentials"
                )
            
            # Verify password
            if not self._verify_password(password, user_row[2]):
                await self._log_security_event(
                    "failed_login",
                    user_id=user_row[0],
                    tenant_id=user_row[4],
                    details={"reason": "invalid_password", "email": email},
                    severity="warning"
                )
                return AuthenticationResult(
                    success=False,
                    error_message="Invalid credentials"
                )
            
            # Use user's tenant if not specified
            if not tenant_config and user_row[4]:
                tenant_config = await self.get_tenant_config(user_row[4])
            
            if not tenant_config:
                return AuthenticationResult(
                    success=False,
                    error_message="No valid tenant found"
                )
            
            # Create tokens
            access_token, claims = await self.create_access_token(user_row[0], tenant_config.tenant_id)
            refresh_token = await self._create_refresh_token(user_row[0], tenant_config.tenant_id)
            
            # Log successful login
            await self._log_security_event(
                "successful_login",
                user_id=user_row[0],
                tenant_id=tenant_config.tenant_id,
                details={"email": email, "role": user_row[3]},
                severity="info"
            )
            
            return AuthenticationResult(
                success=True,
                user_claims=claims,
                token=access_token,
                refresh_token=refresh_token
            )
            
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return AuthenticationResult(
                success=False,
                error_message="Authentication system error"
            )
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    async def _get_user_info(self, user_id: str, tenant_id: str) -> Optional[Dict[str, Any]]:
        """Obtener información básica del usuario"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, email, first_name, last_name, role, institution_id, is_active
                FROM users 
                WHERE id = ? AND institution_id = ? AND is_active = 1
            """, (user_id, tenant_id))
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return {
                    "id": row[0],
                    "email": row[1],
                    "first_name": row[2],
                    "last_name": row[3],
                    "role": row[4],
                    "institution_id": row[5],
                    "is_active": bool(row[6])
                }
                
        except Exception as e:
            logger.error(f"Error getting user info: {e}")
        
        return None
    
    async def _get_user_permissions(self, user_id: str, role: str, tenant_id: str) -> List[str]:
        """Obtener permisos del usuario basado en rol y tenant"""
        
        # Cache key
        cache_key = f"{user_id}:{tenant_id}:{role}"
        if cache_key in self.permission_cache:
            return self.permission_cache[cache_key]
        
        # Default permissions by role
        base_permissions = {
            "student": [
                "course:read", "course:enroll", "progress:read", 
                "assessment:take", "content:view", "profile:edit"
            ],
            "instructor": [
                "course:read", "course:create", "course:edit", "course:delete",
                "content:create", "content:edit", "assessment:create", 
                "student:view", "analytics:view"
            ],
            "admin": [
                "course:*", "user:*", "content:*", "assessment:*", 
                "analytics:*", "system:configure"
            ],
            "institution_admin": [
                "tenant:manage", "user:manage", "course:manage", 
                "analytics:full", "billing:manage", "security:manage"
            ]
        }
        
        permissions = base_permissions.get(role, ["course:read"])
        
        # TODO: Add database-based custom permissions per tenant
        
        # Cache permissions
        self.permission_cache[cache_key] = permissions
        
        return permissions
    
    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verificar password hasheado"""
        # Simple hash verification - en producción usar bcrypt o similar
        return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
    
    async def _create_refresh_token(self, user_id: str, tenant_id: str) -> str:
        """Crear refresh token"""
        token_data = {
            "user_id": user_id,
            "tenant_id": tenant_id,
            "type": "refresh",
            "exp": int((datetime.now(timezone.utc) + timedelta(days=self.refresh_token_expire_days)).timestamp())
        }
        return jwt.encode(token_data, self.jwt_secret, algorithm=self.jwt_algorithm)
    
    async def _log_security_event(self, event_type: str, user_id: str = None, 
                                 tenant_id: str = None, ip_address: str = "unknown",
                                 user_agent: str = "unknown", details: Dict[str, Any] = None,
                                 severity: str = "info"):
        """Registrar evento de seguridad"""
        try:
            event = SecurityEvent(
                event_type=event_type,
                user_id=user_id,
                tenant_id=tenant_id,
                ip_address=ip_address,
                user_agent=user_agent,
                details=details or {},
                severity=severity
            )
            
            # Log to file
            logger.info(f"SECURITY_EVENT: {event.dict()}")
            
            # Store in Redis for real-time monitoring
            if self.redis_client:
                event_key = f"security:events:{datetime.utcnow().strftime('%Y%m%d')}:{uuid.uuid4()}"
                await self.redis_client.setex(event_key, 86400, json.dumps(event.dict(), default=str))
            
        except Exception as e:
            logger.error(f"Error logging security event: {e}")

# =============================================================================
# FASTAPI DEPENDENCIES
# =============================================================================

# Singleton instance
auth_service = MultiTenantAuthService()

# HTTP Bearer for FastAPI
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserClaims:
    """FastAPI dependency para obtener usuario actual"""
    token = credentials.credentials
    return await auth_service.verify_token(token)

async def get_current_tenant(current_user: UserClaims = Depends(get_current_user)) -> TenantConfig:
    """FastAPI dependency para obtener tenant actual"""
    tenant_config = await auth_service.get_tenant_config(current_user.tenant_id)
    if not tenant_config:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant_config

def require_permission(permission: str):
    """Decorator para requerir permisos específicos"""
    def permission_dependency(current_user: UserClaims = Depends(get_current_user)):
        if permission not in current_user.permissions and "*" not in current_user.permissions:
            raise HTTPException(
                status_code=403, 
                detail=f"Permission required: {permission}"
            )
        return current_user
    return permission_dependency

def require_role(allowed_roles: List[str]):
    """Decorator para requerir roles específicos"""
    def role_dependency(current_user: UserClaims = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Role required: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_dependency

# =============================================================================
# RATE LIMITING
# =============================================================================

class RateLimiter:
    """Rate limiter por tenant y usuario"""
    
    def __init__(self, redis_client):
        self.redis_client = redis_client
    
    async def check_rate_limit(self, key: str, limit: int, window_seconds: int = 60) -> Tuple[bool, int]:
        """Check if rate limit is exceeded"""
        try:
            if not self.redis_client:
                return True, limit  # Allow if Redis unavailable
            
            current = await self.redis_client.get(key)
            if current is None:
                await self.redis_client.setex(key, window_seconds, 1)
                return True, limit - 1
            
            current = int(current)
            if current >= limit:
                return False, 0
            
            await self.redis_client.incr(key)
            return True, limit - current - 1
            
        except Exception as e:
            logger.error(f"Rate limit check error: {e}")
            return True, limit  # Allow on error

rate_limiter = RateLimiter(auth_service.redis_client)

def rate_limit(requests_per_minute: int = 60):
    """Rate limiting dependency"""
    async def rate_limit_dependency(
        request: Request,
        current_user: UserClaims = Depends(get_current_user)
    ):
        # Create rate limit key
        rate_key = f"rate_limit:{current_user.tenant_id}:{current_user.user_id}:{int(time.time() // 60)}"
        
        allowed, remaining = await rate_limiter.check_rate_limit(
            rate_key, requests_per_minute, 60
        )
        
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded",
                headers={"X-RateLimit-Remaining": "0"}
            )
        
        return {"remaining": remaining}
    
    return rate_limit_dependency