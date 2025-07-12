"""
Advanced Throttling System - Intelligent Rate Limiting with Dynamic Adaptation
Adaptive Learning Ecosystem - EbroValley Digital

Sistema inteligente de throttling con adaptación dinámica basada en carga del sistema
"""

import time
import json
import asyncio
import psutil
from typing import Dict, List, Optional, Tuple, Union
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
import redis
import logging
from threading import Lock
import math
from .rate_limiting_middleware import rate_limiter, SUBSCRIPTION_LIMITS

logger = logging.getLogger(__name__)

class ThrottleStrategy(Enum):
    """Estrategias de throttling disponibles"""
    FIXED = "fixed"                    # Rate fijo independiente de carga
    ADAPTIVE = "adaptive"              # Adapta según carga del sistema  
    CIRCUIT_BREAKER = "circuit_breaker"  # Corta circuito bajo alta carga
    INTELLIGENT = "intelligent"        # ML-based adaptive throttling

class SystemLoadLevel(Enum):
    """Niveles de carga del sistema"""
    LOW = "low"         # < 30% CPU, < 50% Memory
    MEDIUM = "medium"   # 30-70% CPU, 50-80% Memory  
    HIGH = "high"       # 70-90% CPU, 80-95% Memory
    CRITICAL = "critical"  # > 90% CPU, > 95% Memory

@dataclass
class SystemMetrics:
    """Métricas del sistema para throttling inteligente"""
    cpu_percent: float
    memory_percent: float
    disk_io_percent: float
    network_io_percent: float
    active_connections: int
    response_time_avg: float
    error_rate: float
    timestamp: datetime
    
    def get_load_level(self) -> SystemLoadLevel:
        """Determina el nivel de carga basado en métricas"""
        if self.cpu_percent > 90 or self.memory_percent > 95:
            return SystemLoadLevel.CRITICAL
        elif self.cpu_percent > 70 or self.memory_percent > 80:
            return SystemLoadLevel.HIGH
        elif self.cpu_percent > 30 or self.memory_percent > 50:
            return SystemLoadLevel.MEDIUM
        else:
            return SystemLoadLevel.LOW

@dataclass
class ThrottleConfig:
    """Configuración avanzada de throttling"""
    strategy: ThrottleStrategy
    base_limits: Dict[str, int]  # Límites base por categoría de endpoint
    load_multipliers: Dict[SystemLoadLevel, float]  # Multiplicadores por carga
    burst_multiplier: float
    circuit_breaker_threshold: float  # Error rate threshold
    circuit_breaker_duration: int     # Seconds to keep circuit open
    adaptive_window: int              # Seconds for adaptive calculations
    whitelist_patterns: List[str]     # Patterns for whitelisted endpoints
    blacklist_patterns: List[str]     # Patterns for rate-limited endpoints

class AdvancedThrottlingEngine:
    """
    Motor de throttling avanzado con adaptación inteligente
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379/2"):
        self.redis_client = self._init_redis(redis_url)
        self.system_metrics_cache = {}
        self.circuit_breakers = {}
        self.adaptive_multipliers = {}
        self.lock = Lock()
        
        # Configuración por defecto
        self.config = ThrottleConfig(
            strategy=ThrottleStrategy.INTELLIGENT,
            base_limits={
                'expensive': 10,    # AI/ML endpoints
                'standard': 60,     # CRUD operations  
                'auth': 20,         # Authentication
                'admin': 100        # Admin operations
            },
            load_multipliers={
                SystemLoadLevel.LOW: 1.2,      # 20% más requests cuando hay poca carga
                SystemLoadLevel.MEDIUM: 1.0,   # Límites normales
                SystemLoadLevel.HIGH: 0.7,     # 30% menos requests
                SystemLoadLevel.CRITICAL: 0.3  # Solo 30% de los requests normales
            },
            burst_multiplier=1.5,
            circuit_breaker_threshold=0.15,  # 15% error rate
            circuit_breaker_duration=60,     # 1 minute
            adaptive_window=300,              # 5 minutes
            whitelist_patterns=[
                '/health',
                '/metrics', 
                '/api/auth/logout'
            ],
            blacklist_patterns=[
                '/api/admin/backup',
                '/api/analytics/export'
            ]
        )
        
        logger.info("🚀 Advanced Throttling Engine initialized")
    
    def _init_redis(self, redis_url: str) -> Optional[redis.Redis]:
        """Initialize Redis connection for throttling state"""
        try:
            client = redis.from_url(redis_url, decode_responses=True)
            client.ping()
            logger.info("✅ Advanced throttling connected to Redis")
            return client
        except redis.ConnectionError:
            logger.warning("⚠️  Redis not available for advanced throttling")
            return None
    
    def get_system_metrics(self) -> SystemMetrics:
        """Recopilar métricas del sistema en tiempo real"""
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            disk_io = psutil.disk_io_counters()
            network_io = psutil.net_io_counters()
            
            # Calcular métricas derivadas
            disk_io_percent = min(100, (disk_io.read_bytes + disk_io.write_bytes) / (1024**3))
            network_io_percent = min(100, (network_io.bytes_sent + network_io.bytes_recv) / (1024**3))
            
            # Obtener métricas de aplicación desde Redis
            active_connections = self._get_active_connections()
            response_time_avg = self._get_avg_response_time()
            error_rate = self._get_error_rate()
            
            metrics = SystemMetrics(
                cpu_percent=cpu_percent,
                memory_percent=memory.percent,
                disk_io_percent=disk_io_percent,
                network_io_percent=network_io_percent,
                active_connections=active_connections,
                response_time_avg=response_time_avg,
                error_rate=error_rate,
                timestamp=datetime.now()
            )
            
            # Cache metrics for performance
            self.system_metrics_cache = asdict(metrics)
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
            # Return safe defaults
            return SystemMetrics(
                cpu_percent=50.0,
                memory_percent=60.0,
                disk_io_percent=30.0,
                network_io_percent=20.0,
                active_connections=100,
                response_time_avg=100.0,
                error_rate=0.05,
                timestamp=datetime.now()
            )
    
    def _get_active_connections(self) -> int:
        """Get active connections from Redis"""
        if self.redis_client:
            try:
                return len(self.redis_client.keys('session:*'))
            except:
                return 100
        return 100
    
    def _get_avg_response_time(self) -> float:
        """Get average response time from metrics"""
        if self.redis_client:
            try:
                times = self.redis_client.lrange('response_times', 0, 99)
                if times:
                    return sum(float(t) for t in times) / len(times)
            except:
                pass
        return 100.0
    
    def _get_error_rate(self) -> float:
        """Get current error rate"""
        if self.redis_client:
            try:
                errors = int(self.redis_client.get('error_count') or 0)
                requests = int(self.redis_client.get('request_count') or 1)
                return errors / requests if requests > 0 else 0.0
            except:
                pass
        return 0.05
    
    def _should_apply_circuit_breaker(self, endpoint: str) -> bool:
        """Check if circuit breaker should be applied"""
        circuit_key = f"circuit_breaker:{endpoint}"
        
        if self.redis_client:
            try:
                circuit_state = self.redis_client.hgetall(circuit_key)
                if circuit_state:
                    state = circuit_state.get('state', 'closed')
                    if state == 'open':
                        # Check if circuit should transition to half-open
                        open_time = float(circuit_state.get('open_time', 0))
                        if time.time() - open_time > self.config.circuit_breaker_duration:
                            # Transition to half-open
                            self.redis_client.hset(circuit_key, 'state', 'half_open')
                            return False
                        return True
                    elif state == 'half_open':
                        # Allow limited requests to test if service recovered
                        return False
                
                # Check if we should open the circuit
                metrics = self.get_system_metrics()
                if metrics.error_rate > self.config.circuit_breaker_threshold:
                    # Open circuit breaker
                    self.redis_client.hset(circuit_key, mapping={
                        'state': 'open',
                        'open_time': time.time(),
                        'error_rate': metrics.error_rate
                    })
                    self.redis_client.expire(circuit_key, self.config.circuit_breaker_duration * 2)
                    logger.warning(f"🔴 Circuit breaker opened for {endpoint} (error rate: {metrics.error_rate:.2%})")
                    return True
                    
            except Exception as e:
                logger.error(f"Error checking circuit breaker: {e}")
        
        return False
    
    def _calculate_adaptive_multiplier(self, endpoint_category: str, tenant_id: str) -> float:
        """Calculate adaptive rate limiting multiplier"""
        metrics = self.get_system_metrics()
        load_level = metrics.get_load_level()
        
        # Base multiplier from load level
        base_multiplier = self.config.load_multipliers[load_level]
        
        # Adjust based on endpoint category
        category_adjustments = {
            'expensive': 0.8,   # More restrictive for expensive endpoints
            'standard': 1.0,    # Normal adjustment
            'auth': 1.1,        # Slightly more lenient for auth
            'admin': 0.9        # Slightly more restrictive for admin
        }
        
        category_multiplier = category_adjustments.get(endpoint_category, 1.0)
        
        # Tenant-specific adjustments based on historical behavior
        tenant_multiplier = self._get_tenant_behavior_multiplier(tenant_id)
        
        # Combine all multipliers
        final_multiplier = base_multiplier * category_multiplier * tenant_multiplier
        
        # Ensure reasonable bounds
        final_multiplier = max(0.1, min(2.0, final_multiplier))
        
        logger.debug(f"Adaptive multiplier for {endpoint_category}/{tenant_id}: {final_multiplier:.2f}")
        return final_multiplier
    
    def _get_tenant_behavior_multiplier(self, tenant_id: str) -> float:
        """Get behavior-based multiplier for tenant"""
        if not tenant_id or not self.redis_client:
            return 1.0
        
        try:
            behavior_key = f"tenant_behavior:{tenant_id}"
            behavior_data = self.redis_client.hgetall(behavior_key)
            
            if not behavior_data:
                return 1.0
            
            # Calculate multiplier based on historical behavior
            avg_response_time = float(behavior_data.get('avg_response_time', 100))
            error_rate = float(behavior_data.get('error_rate', 0))
            abuse_score = float(behavior_data.get('abuse_score', 0))
            
            # Good behavior gets higher limits
            if error_rate < 0.01 and avg_response_time < 200 and abuse_score < 0.1:
                return 1.2  # 20% bonus
            # Poor behavior gets lower limits  
            elif error_rate > 0.05 or abuse_score > 0.5:
                return 0.7  # 30% penalty
            else:
                return 1.0  # Normal limits
                
        except Exception as e:
            logger.error(f"Error calculating tenant behavior multiplier: {e}")
            return 1.0
    
    def _is_endpoint_whitelisted(self, endpoint: str) -> bool:
        """Check if endpoint is whitelisted from throttling"""
        for pattern in self.config.whitelist_patterns:
            if pattern in endpoint:
                return True
        return False
    
    def _is_endpoint_blacklisted(self, endpoint: str) -> bool:
        """Check if endpoint requires extra throttling"""
        for pattern in self.config.blacklist_patterns:
            if pattern in endpoint:
                return True
        return False
    
    def _update_tenant_behavior(self, tenant_id: str, response_time: float, had_error: bool):
        """Update tenant behavior metrics"""
        if not tenant_id or not self.redis_client:
            return
        
        try:
            behavior_key = f"tenant_behavior:{tenant_id}"
            current_time = time.time()
            
            # Use pipeline for atomic updates
            pipe = self.redis_client.pipeline()
            
            # Update response time (rolling average)
            pipe.lpush(f"{behavior_key}:response_times", response_time)
            pipe.ltrim(f"{behavior_key}:response_times", 0, 99)  # Keep last 100
            
            # Update error count
            if had_error:
                pipe.incr(f"{behavior_key}:errors")
            pipe.incr(f"{behavior_key}:requests")
            
            # Set expiration
            pipe.expire(behavior_key, 86400)  # 24 hours
            pipe.expire(f"{behavior_key}:response_times", 86400)
            pipe.expire(f"{behavior_key}:errors", 86400)
            pipe.expire(f"{behavior_key}:requests", 86400)
            
            pipe.execute()
            
        except Exception as e:
            logger.error(f"Error updating tenant behavior: {e}")
    
    def calculate_dynamic_limits(
        self,
        subscription_plan: str,
        endpoint_category: str,
        tenant_id: str,
        endpoint: str
    ) -> Dict[str, int]:
        """
        Calculate dynamic rate limits based on current system state
        """
        
        # Check if endpoint is whitelisted (unlimited)
        if self._is_endpoint_whitelisted(endpoint):
            return {
                'requests_per_minute': 10000,
                'burst_capacity': 1000,
                'concurrent_requests': 500
            }
        
        # Get base limits from subscription plan
        base_config = SUBSCRIPTION_LIMITS[subscription_plan]
        
        # Check circuit breaker
        if self._should_apply_circuit_breaker(endpoint):
            return {
                'requests_per_minute': 0,
                'burst_capacity': 0,
                'concurrent_requests': 0
            }
        
        # Apply throttling strategy
        if self.config.strategy == ThrottleStrategy.FIXED:
            # Use base limits without modification
            multiplier = 1.0
        elif self.config.strategy == ThrottleStrategy.ADAPTIVE:
            # Simple load-based adaptation
            metrics = self.get_system_metrics()
            load_level = metrics.get_load_level()
            multiplier = self.config.load_multipliers[load_level]
        elif self.config.strategy == ThrottleStrategy.INTELLIGENT:
            # Full intelligent adaptation
            multiplier = self._calculate_adaptive_multiplier(endpoint_category, tenant_id)
        else:
            multiplier = 1.0
        
        # Apply blacklist penalties
        if self._is_endpoint_blacklisted(endpoint):
            multiplier *= 0.5  # 50% penalty for blacklisted endpoints
        
        # Calculate final limits
        base_rpm = getattr(base_config, f'{endpoint_category}_endpoints_rpm', base_config.standard_endpoints_rpm)
        
        dynamic_limits = {
            'requests_per_minute': max(1, int(base_rpm * multiplier)),
            'burst_capacity': max(1, int(base_config.burst_capacity * multiplier * self.config.burst_multiplier)),
            'concurrent_requests': max(1, int(base_config.concurrent_requests * multiplier))
        }
        
        # Log significant changes
        if abs(multiplier - 1.0) > 0.2:
            logger.info(
                f"Dynamic limits applied: {subscription_plan}/{endpoint_category} "
                f"multiplier={multiplier:.2f}, limits={dynamic_limits}"
            )
        
        return dynamic_limits
    
    def record_request_metrics(
        self,
        tenant_id: str,
        endpoint: str,
        response_time: float,
        status_code: int,
        user_agent: str = None
    ):
        """Record request metrics for adaptive throttling"""
        
        # Update system-wide metrics
        if self.redis_client:
            try:
                pipe = self.redis_client.pipeline()
                
                # Record response time
                pipe.lpush('response_times', response_time)
                pipe.ltrim('response_times', 0, 999)  # Keep last 1000
                
                # Record request count
                pipe.incr('request_count')
                pipe.expire('request_count', 3600)  # 1 hour window
                
                # Record errors
                if status_code >= 400:
                    pipe.incr('error_count')
                    pipe.expire('error_count', 3600)
                
                # Record endpoint-specific metrics
                endpoint_key = f"endpoint_metrics:{endpoint}"
                pipe.hincrby(endpoint_key, 'requests', 1)
                pipe.hincrbyfloat(endpoint_key, 'total_response_time', response_time)
                if status_code >= 400:
                    pipe.hincrby(endpoint_key, 'errors', 1)
                pipe.expire(endpoint_key, 3600)
                
                pipe.execute()
                
                # Update tenant behavior (separate call to avoid pipeline complexity)
                self._update_tenant_behavior(tenant_id, response_time, status_code >= 400)
                
            except Exception as e:
                logger.error(f"Error recording request metrics: {e}")
    
    def get_throttling_stats(self) -> Dict[str, any]:
        """Get comprehensive throttling statistics"""
        stats = {
            'timestamp': datetime.now().isoformat(),
            'strategy': self.config.strategy.value,
            'system_metrics': self.system_metrics_cache,
            'circuit_breakers': [],
            'adaptive_multipliers': {},
            'top_throttled_endpoints': []
        }
        
        if self.redis_client:
            try:
                # Get circuit breaker states
                cb_keys = self.redis_client.keys('circuit_breaker:*')
                for key in cb_keys:
                    cb_data = self.redis_client.hgetall(key)
                    if cb_data:
                        stats['circuit_breakers'].append({
                            'endpoint': key.split(':', 1)[1],
                            'state': cb_data.get('state', 'closed'),
                            'error_rate': float(cb_data.get('error_rate', 0))
                        })
                
                # Get endpoint statistics
                endpoint_keys = self.redis_client.keys('endpoint_metrics:*')
                endpoint_stats = []
                
                for key in endpoint_keys:
                    endpoint_data = self.redis_client.hgetall(key)
                    if endpoint_data:
                        requests = int(endpoint_data.get('requests', 0))
                        errors = int(endpoint_data.get('errors', 0))
                        total_time = float(endpoint_data.get('total_response_time', 0))
                        
                        endpoint_stats.append({
                            'endpoint': key.split(':', 1)[1],
                            'requests': requests,
                            'errors': errors,
                            'error_rate': errors / requests if requests > 0 else 0,
                            'avg_response_time': total_time / requests if requests > 0 else 0
                        })
                
                # Sort by request count and get top 10
                stats['top_throttled_endpoints'] = sorted(
                    endpoint_stats,
                    key=lambda x: x['requests'],
                    reverse=True
                )[:10]
                
            except Exception as e:
                logger.error(f"Error getting throttling stats: {e}")
        
        return stats
    
    def reset_circuit_breaker(self, endpoint: str) -> bool:
        """Manually reset a circuit breaker"""
        if not self.redis_client:
            return False
        
        try:
            circuit_key = f"circuit_breaker:{endpoint}"
            self.redis_client.hset(circuit_key, 'state', 'closed')
            logger.info(f"🟢 Circuit breaker reset for {endpoint}")
            return True
        except Exception as e:
            logger.error(f"Error resetting circuit breaker: {e}")
            return False
    
    def update_strategy(self, strategy: ThrottleStrategy) -> bool:
        """Update throttling strategy dynamically"""
        try:
            self.config.strategy = strategy
            logger.info(f"Throttling strategy updated to: {strategy.value}")
            return True
        except Exception as e:
            logger.error(f"Error updating strategy: {e}")
            return False

# Global advanced throttling instance
advanced_throttling = AdvancedThrottlingEngine()

# Integration with rate limiter
def get_intelligent_rate_limits(
    subscription_plan: str,
    endpoint_category: str,
    tenant_id: str,
    endpoint: str
) -> Dict[str, int]:
    """
    Get intelligent rate limits that adapt to system conditions
    """
    return advanced_throttling.calculate_dynamic_limits(
        subscription_plan=subscription_plan,
        endpoint_category=endpoint_category,
        tenant_id=tenant_id,
        endpoint=endpoint
    )

def record_request_performance(
    tenant_id: str,
    endpoint: str,
    response_time: float,
    status_code: int,
    user_agent: str = None
):
    """Record request performance for adaptive learning"""
    advanced_throttling.record_request_metrics(
        tenant_id=tenant_id,
        endpoint=endpoint,
        response_time=response_time,
        status_code=status_code,
        user_agent=user_agent
    )

# Middleware integration hook
def apply_advanced_throttling_to_rate_limiter():
    """
    Integrate advanced throttling with existing rate limiter
    """
    original_check = rate_limiter.check_rate_limit
    
    def enhanced_check_rate_limit(request, user_id=None, tenant_id=None, subscription_plan='starter', endpoint=None):
        # Get endpoint category
        endpoint_category = rate_limiter._get_endpoint_category(endpoint or "")
        
        # Get intelligent limits
        dynamic_limits = get_intelligent_rate_limits(
            subscription_plan=subscription_plan,
            endpoint_category=endpoint_category,
            tenant_id=tenant_id or "unknown",
            endpoint=endpoint or ""
        )
        
        # Temporarily override rate limiter config with dynamic limits
        original_config = rate_limiter._get_rate_limit_config(subscription_plan)
        
        # Apply dynamic limits
        if endpoint_category == 'expensive':
            original_config.expensive_endpoints_rpm = dynamic_limits['requests_per_minute']
        elif endpoint_category == 'auth':
            original_config.auth_endpoints_rpm = dynamic_limits['requests_per_minute']
        else:
            original_config.standard_endpoints_rpm = dynamic_limits['requests_per_minute']
        
        original_config.burst_capacity = dynamic_limits['burst_capacity']
        original_config.concurrent_requests = dynamic_limits['concurrent_requests']
        
        # Call original check with modified config
        return original_check(request, user_id, tenant_id, subscription_plan, endpoint)
    
    # Replace the method
    rate_limiter.check_rate_limit = enhanced_check_rate_limit
    
    logger.info("🧠 Advanced throttling integrated with rate limiter")

# Auto-apply integration when module is imported
apply_advanced_throttling_to_rate_limiter()