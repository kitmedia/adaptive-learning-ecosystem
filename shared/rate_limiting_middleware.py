"""
Enterprise Rate Limiting Middleware - Advanced API Protection
Adaptive Learning Ecosystem - EbroValley Digital

Sistema avanzado de rate limiting con Redis backend, límites por tenant y usuario
"""

import time
import json
import hashlib
from typing import Dict, List, Optional, Tuple, Union
from dataclasses import dataclass, asdict
from functools import wraps
from flask import request, jsonify, g
from fastapi import Request, HTTPException, Depends
from fastapi.responses import JSONResponse
import redis
import asyncio
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class RateLimitConfig:
    """Configuración de rate limiting por plan de suscripción"""
    requests_per_minute: int
    requests_per_hour: int
    requests_per_day: int
    burst_capacity: int
    concurrent_requests: int
    
    # Límites específicos por endpoint
    expensive_endpoints_rpm: int  # ej: AI, Analytics
    standard_endpoints_rpm: int   # ej: CRUD operations
    auth_endpoints_rpm: int       # ej: Login, Register

# Configuraciones por plan de suscripción
SUBSCRIPTION_LIMITS = {
    'starter': RateLimitConfig(
        requests_per_minute=100,
        requests_per_hour=3000,
        requests_per_day=50000,
        burst_capacity=20,
        concurrent_requests=10,
        expensive_endpoints_rpm=10,
        standard_endpoints_rpm=60,
        auth_endpoints_rpm=20
    ),
    'professional': RateLimitConfig(
        requests_per_minute=500,
        requests_per_hour=15000,
        requests_per_day=300000,
        burst_capacity=100,
        concurrent_requests=50,
        expensive_endpoints_rpm=50,
        standard_endpoints_rpm=300,
        auth_endpoints_rpm=100
    ),
    'enterprise': RateLimitConfig(
        requests_per_minute=2000,
        requests_per_hour=60000,
        requests_per_day=1200000,
        burst_capacity=500,
        concurrent_requests=200,
        expensive_endpoints_rpm=200,
        standard_endpoints_rpm=1200,
        auth_endpoints_rpm=400
    ),
    'system_admin': RateLimitConfig(
        requests_per_minute=10000,
        requests_per_hour=300000,
        requests_per_day=5000000,
        burst_capacity=2000,
        concurrent_requests=1000,
        expensive_endpoints_rpm=1000,
        standard_endpoints_rpm=6000,
        auth_endpoints_rpm=2000
    )
}

# Categorización de endpoints por tipo
ENDPOINT_CATEGORIES = {
    'expensive': [
        '/api/ai-tutor/generate',
        '/api/ai-tutor/analyze',
        '/api/analytics/report',
        '/api/analytics/export',
        '/api/recommendations/generate',
        '/api/admin/backup',
        '/api/monitoring/export'
    ],
    'auth': [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/refresh',
        '/api/auth/reset-password',
        '/api/auth/verify-email'
    ],
    'standard': [
        '/api/courses',
        '/api/progress',
        '/api/content',
        '/api/users/profile',
        '/api/admin/users',
        '/api/admin/tenants'
    ]
}

class EnterpriseRateLimiter:
    """
    Rate Limiter empresarial con Redis backend y múltiples estrategias
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379/1"):
        """Initialize rate limiter with Redis connection"""
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            # Test connection
            self.redis_client.ping()
            logger.info("✅ Rate limiter connected to Redis successfully")
        except redis.ConnectionError:
            logger.warning("⚠️  Redis not available, using in-memory fallback")
            self.redis_client = None
            self.memory_store = {}
    
    def _get_client_id(self, request: Union[Request, any], user_id: str = None, tenant_id: str = None) -> str:
        """Generate unique client identifier"""
        # Priority: user_id > tenant_id > IP address
        if user_id:
            return f"user:{user_id}"
        elif tenant_id:
            return f"tenant:{tenant_id}"
        else:
            # Fallback to IP address
            client_ip = self._get_client_ip(request)
            return f"ip:{client_ip}"
    
    def _get_client_ip(self, request: Union[Request, any]) -> str:
        """Extract client IP address with proxy support"""
        # Check for common proxy headers
        forwarded_for = getattr(request, 'headers', {}).get('X-Forwarded-For')
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()
        
        real_ip = getattr(request, 'headers', {}).get('X-Real-IP')
        if real_ip:
            return real_ip
        
        # Fallback to direct client IP
        if hasattr(request, 'client'):
            return request.client.host
        elif hasattr(request, 'remote_addr'):
            return request.remote_addr
        else:
            return '127.0.0.1'
    
    def _get_endpoint_category(self, endpoint: str) -> str:
        """Categorize endpoint by computational cost"""
        for category, endpoints in ENDPOINT_CATEGORIES.items():
            if any(endpoint.startswith(ep) for ep in endpoints):
                return category
        return 'standard'  # Default category
    
    def _get_rate_limit_config(self, subscription_plan: str) -> RateLimitConfig:
        """Get rate limit configuration for subscription plan"""
        return SUBSCRIPTION_LIMITS.get(subscription_plan, SUBSCRIPTION_LIMITS['starter'])
    
    def _get_redis_key(self, client_id: str, window: str, endpoint: str = None) -> str:
        """Generate Redis key for rate limiting"""
        timestamp = int(time.time())
        
        if window == 'minute':
            window_start = timestamp // 60
        elif window == 'hour':
            window_start = timestamp // 3600
        elif window == 'day':
            window_start = timestamp // 86400
        else:
            window_start = timestamp
        
        if endpoint:
            return f"rate_limit:{client_id}:{window}:{window_start}:{endpoint}"
        else:
            return f"rate_limit:{client_id}:{window}:{window_start}"
    
    def _increment_counter(self, key: str, ttl: int) -> int:
        """Increment Redis counter with TTL"""
        if self.redis_client:
            try:
                pipe = self.redis_client.pipeline()
                pipe.incr(key)
                pipe.expire(key, ttl)
                result = pipe.execute()
                return result[0]
            except redis.RedisError as e:
                logger.error(f"Redis error: {e}")
                return self._fallback_increment(key)
        else:
            return self._fallback_increment(key)
    
    def _fallback_increment(self, key: str) -> int:
        """In-memory fallback when Redis is unavailable"""
        current_time = time.time()
        
        # Clean old entries (older than 1 day)
        cutoff_time = current_time - 86400
        self.memory_store = {
            k: v for k, v in self.memory_store.items() 
            if v.get('timestamp', 0) > cutoff_time
        }
        
        if key not in self.memory_store:
            self.memory_store[key] = {'count': 0, 'timestamp': current_time}
        
        self.memory_store[key]['count'] += 1
        return self.memory_store[key]['count']
    
    def _get_burst_tokens(self, client_id: str, config: RateLimitConfig) -> int:
        """Implement token bucket algorithm for burst capacity"""
        bucket_key = f"burst_bucket:{client_id}"
        
        if self.redis_client:
            try:
                # Get current bucket state
                bucket_data = self.redis_client.hgetall(bucket_key)
                
                if not bucket_data:
                    # Initialize bucket
                    self.redis_client.hset(bucket_key, mapping={
                        'tokens': config.burst_capacity,
                        'last_refill': time.time()
                    })
                    self.redis_client.expire(bucket_key, 3600)
                    return config.burst_capacity
                
                tokens = int(bucket_data.get('tokens', 0))
                last_refill = float(bucket_data.get('last_refill', time.time()))
                
                # Calculate token refill
                current_time = time.time()
                time_passed = current_time - last_refill
                tokens_to_add = int(time_passed * (config.requests_per_minute / 60))
                
                # Refill tokens (max = burst_capacity)
                tokens = min(config.burst_capacity, tokens + tokens_to_add)
                
                # Update bucket
                self.redis_client.hset(bucket_key, mapping={
                    'tokens': tokens,
                    'last_refill': current_time
                })
                
                return tokens
                
            except redis.RedisError:
                return config.burst_capacity // 2  # Fallback
        else:
            return config.burst_capacity // 2  # Memory fallback
    
    def _consume_burst_token(self, client_id: str) -> bool:
        """Consume a burst token if available"""
        bucket_key = f"burst_bucket:{client_id}"
        
        if self.redis_client:
            try:
                tokens = self.redis_client.hget(bucket_key, 'tokens')
                if tokens and int(tokens) > 0:
                    self.redis_client.hincrby(bucket_key, 'tokens', -1)
                    return True
                return False
            except redis.RedisError:
                return True  # Allow on Redis error
        else:
            return True  # Memory fallback always allows
    
    def check_rate_limit(
        self, 
        request: Union[Request, any],
        user_id: str = None,
        tenant_id: str = None,
        subscription_plan: str = 'starter',
        endpoint: str = None
    ) -> Tuple[bool, Dict[str, any]]:
        """
        Check if request should be rate limited
        
        Returns:
            (allowed: bool, headers: dict)
        """
        
        client_id = self._get_client_id(request, user_id, tenant_id)
        config = self._get_rate_limit_config(subscription_plan)
        
        if not endpoint:
            endpoint = getattr(request, 'url', {}).path if hasattr(request, 'url') else str(request)
        
        endpoint_category = self._get_endpoint_category(endpoint)
        
        # Get endpoint-specific limit
        if endpoint_category == 'expensive':
            rpm_limit = config.expensive_endpoints_rpm
        elif endpoint_category == 'auth':
            rpm_limit = config.auth_endpoints_rpm
        else:
            rpm_limit = config.standard_endpoints_rpm
        
        current_time = int(time.time())
        
        # Check different time windows
        minute_key = self._get_redis_key(client_id, 'minute', endpoint)
        hour_key = self._get_redis_key(client_id, 'hour')
        day_key = self._get_redis_key(client_id, 'day')
        
        # Get current counts
        minute_count = self._increment_counter(minute_key, 60)
        hour_count = self._increment_counter(hour_key, 3600)
        day_count = self._increment_counter(day_key, 86400)
        
        # Check burst capacity
        burst_tokens = self._get_burst_tokens(client_id, config)
        
        # Determine if request should be allowed
        allowed = True
        limit_exceeded = None
        
        if minute_count > rpm_limit:
            # Check if burst tokens can handle the overflow
            if burst_tokens > 0:
                self._consume_burst_token(client_id)
                logger.info(f"Burst token used for {client_id}, remaining: {burst_tokens-1}")
            else:
                allowed = False
                limit_exceeded = 'minute'
        
        if hour_count > config.requests_per_hour:
            allowed = False
            limit_exceeded = 'hour'
        
        if day_count > config.requests_per_day:
            allowed = False
            limit_exceeded = 'day'
        
        # Calculate reset times
        minute_reset = (current_time // 60 + 1) * 60
        hour_reset = (current_time // 3600 + 1) * 3600
        day_reset = (current_time // 86400 + 1) * 86400
        
        # Prepare response headers
        headers = {
            'X-RateLimit-Limit-Minute': str(rpm_limit),
            'X-RateLimit-Limit-Hour': str(config.requests_per_hour),
            'X-RateLimit-Limit-Day': str(config.requests_per_day),
            'X-RateLimit-Remaining-Minute': str(max(0, rpm_limit - minute_count)),
            'X-RateLimit-Remaining-Hour': str(max(0, config.requests_per_hour - hour_count)),
            'X-RateLimit-Remaining-Day': str(max(0, config.requests_per_day - day_count)),
            'X-RateLimit-Reset-Minute': str(minute_reset),
            'X-RateLimit-Reset-Hour': str(hour_reset),
            'X-RateLimit-Reset-Day': str(day_reset),
            'X-RateLimit-Burst-Capacity': str(config.burst_capacity),
            'X-RateLimit-Burst-Remaining': str(burst_tokens),
            'X-RateLimit-Client-ID': client_id,
            'X-RateLimit-Endpoint-Category': endpoint_category
        }
        
        if not allowed:
            headers['X-RateLimit-Limit-Exceeded'] = limit_exceeded
            headers['Retry-After'] = str(minute_reset - current_time)
            
            # Log rate limit violation
            logger.warning(
                f"Rate limit exceeded for {client_id} "
                f"(plan: {subscription_plan}, endpoint: {endpoint}, "
                f"category: {endpoint_category}, limit: {limit_exceeded})"
            )
        
        return allowed, headers

# Global rate limiter instance
rate_limiter = EnterpriseRateLimiter()

def rate_limit(
    subscription_plan: str = 'starter',
    endpoint: str = None,
    require_auth: bool = True
):
    """
    Decorator for Flask/FastAPI rate limiting
    
    Usage:
        @rate_limit(subscription_plan='professional', endpoint='/api/ai-tutor')
        def my_endpoint():
            pass
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # FastAPI async handler
            request = None
            user_id = None
            tenant_id = None
            plan = subscription_plan
            
            # Extract request from args/kwargs
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if not request:
                # Try to get from dependency injection
                request = kwargs.get('request')
            
            # Try to get user context from global state or dependency
            if hasattr(g, 'current_user'):
                user_id = g.current_user.get('user_id')
                tenant_id = g.current_user.get('tenant_id')
                plan = g.current_user.get('subscription_plan', subscription_plan)
            
            # Check rate limit
            allowed, headers = rate_limiter.check_rate_limit(
                request=request,
                user_id=user_id,
                tenant_id=tenant_id,
                subscription_plan=plan,
                endpoint=endpoint or (request.url.path if request else None)
            )
            
            if not allowed:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "Rate limit exceeded",
                        "message": f"Too many requests. Limit exceeded: {headers.get('X-RateLimit-Limit-Exceeded')}",
                        "retry_after": int(headers.get('Retry-After', 60)),
                        "headers": headers
                    },
                    headers=headers
                )
            
            # Call original function
            response = await func(*args, **kwargs)
            
            # Add rate limit headers to response
            if hasattr(response, 'headers'):
                for key, value in headers.items():
                    response.headers[key] = value
            
            return response
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Flask sync handler
            user_id = getattr(g, 'user_id', None)
            tenant_id = getattr(g, 'tenant_id', None)
            plan = getattr(g, 'subscription_plan', subscription_plan)
            
            # Check rate limit
            allowed, headers = rate_limiter.check_rate_limit(
                request=request,
                user_id=user_id,
                tenant_id=tenant_id,
                subscription_plan=plan,
                endpoint=endpoint or request.path
            )
            
            if not allowed:
                response = jsonify({
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Limit exceeded: {headers.get('X-RateLimit-Limit-Exceeded')}",
                    "retry_after": int(headers.get('Retry-After', 60))
                })
                response.status_code = 429
                
                # Add rate limit headers
                for key, value in headers.items():
                    response.headers[key] = value
                
                return response
            
            # Call original function
            response = func(*args, **kwargs)
            
            # Add rate limit headers to successful response
            if hasattr(response, 'headers'):
                for key, value in headers.items():
                    response.headers[key] = value
            
            return response
        
        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

# Utility functions for monitoring and management

def get_rate_limit_stats(client_id: str = None, tenant_id: str = None) -> Dict[str, any]:
    """Get rate limiting statistics for monitoring"""
    stats = {
        'timestamp': datetime.now().isoformat(),
        'total_clients': 0,
        'active_limits': 0,
        'top_consumers': [],
        'blocked_requests': 0
    }
    
    if rate_limiter.redis_client:
        try:
            # Get all rate limit keys
            keys = rate_limiter.redis_client.keys('rate_limit:*')
            stats['total_clients'] = len(set(key.split(':')[1] for key in keys))
            stats['active_limits'] = len(keys)
            
            # Get top consumers (simplified)
            client_counts = {}
            for key in keys:
                client = key.split(':')[1]
                count = int(rate_limiter.redis_client.get(key) or 0)
                client_counts[client] = client_counts.get(client, 0) + count
            
            # Sort and get top 10
            stats['top_consumers'] = sorted(
                client_counts.items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:10]
            
        except redis.RedisError as e:
            logger.error(f"Error getting rate limit stats: {e}")
    
    return stats

def reset_rate_limit(client_id: str, window: str = 'all') -> bool:
    """Reset rate limits for a specific client"""
    if not rate_limiter.redis_client:
        return False
    
    try:
        if window == 'all':
            keys = rate_limiter.redis_client.keys(f'rate_limit:{client_id}:*')
        else:
            keys = rate_limiter.redis_client.keys(f'rate_limit:{client_id}:{window}:*')
        
        if keys:
            rate_limiter.redis_client.delete(*keys)
            logger.info(f"Reset rate limits for {client_id} (window: {window})")
            return True
        
        return False
        
    except redis.RedisError as e:
        logger.error(f"Error resetting rate limit: {e}")
        return False

def whitelist_client(client_id: str, duration_hours: int = 24) -> bool:
    """Temporarily whitelist a client from rate limiting"""
    if not rate_limiter.redis_client:
        return False
    
    try:
        whitelist_key = f"rate_limit:whitelist:{client_id}"
        rate_limiter.redis_client.setex(
            whitelist_key, 
            duration_hours * 3600, 
            "whitelisted"
        )
        logger.info(f"Whitelisted {client_id} for {duration_hours} hours")
        return True
        
    except redis.RedisError as e:
        logger.error(f"Error whitelisting client: {e}")
        return False

def is_whitelisted(client_id: str) -> bool:
    """Check if client is whitelisted"""
    if not rate_limiter.redis_client:
        return False
    
    try:
        whitelist_key = f"rate_limit:whitelist:{client_id}"
        return rate_limiter.redis_client.exists(whitelist_key)
    except redis.RedisError:
        return False