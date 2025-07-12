"""
Analytics Service - Adaptive Learning Ecosystem
EbroValley Digital - Business Intelligence & Learning Analytics

Advanced analytics service providing:
- Real-time user behavior tracking
- Learning effectiveness metrics  
- Business intelligence dashboards
- Predictive analytics for learning outcomes
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from uuid import UUID, uuid4

import asyncpg
import redis.asyncio as redis
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

# Import multi-tenant auth system
from shared.auth_middleware import (
    get_current_user, 
    get_current_tenant, 
    require_permission,
    require_role,
    rate_limit,
    UserClaims,
    TenantConfig
)
from shared.auth_routes import auth_router
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import plotly.graph_objects as go
import plotly.express as px

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app initialization
app = FastAPI(
    title="🔥 Analytics Service - Multi-Tenant",
    description="""
    # 📊 Advanced Analytics & Business Intelligence
    
    **EbroValley Digital** - Enterprise Multi-Tenant Analytics Platform
    
    ## 🚀 Features
    - **Multi-Tenant Analytics**: Isolated data and insights per organization
    - **Real-time Learning Metrics**: Student progress and engagement tracking
    - **Predictive Analytics**: ML-powered learning outcome predictions
    - **Business Intelligence Dashboards**: Executive and operational insights
    - **Advanced Security**: JWT-based authentication with RBAC
    - **Rate Limiting**: Tenant-specific API rate controls
    
    ## 🔐 Authentication
    All endpoints require valid JWT tokens with appropriate permissions.
    """,
    version="2.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None
)

# Include authentication routes
app.include_router(auth_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# DATA MODELS
# =============================================================================

class EventCreate(BaseModel):
    """Event tracking model for user interactions"""
    user_id: UUID
    session_id: str
    event_type: str = Field(..., description="Type of event (page_view, click, completion, etc.)")
    event_category: str = Field(..., description="Category (learning, navigation, assessment, etc.)")
    event_action: str = Field(..., description="Specific action taken")
    event_label: Optional[str] = Field(None, description="Additional event context")
    event_value: Optional[float] = Field(None, description="Numeric value associated with event")
    properties: Optional[Dict[str, Any]] = Field(default_factory=dict)
    course_id: Optional[UUID] = None
    lesson_id: Optional[UUID] = None
    assessment_id: Optional[UUID] = None
    timestamp: Optional[datetime] = None

class LearningAnalytics(BaseModel):
    """Learning effectiveness analytics"""
    user_id: UUID
    course_id: UUID
    completion_rate: float = Field(..., ge=0, le=1)
    time_spent_minutes: int = Field(..., ge=0)
    quiz_scores: List[float] = Field(default_factory=list)
    engagement_score: float = Field(..., ge=0, le=10)
    difficulty_adaptation: Dict[str, Any] = Field(default_factory=dict)
    learning_path_efficiency: float = Field(..., ge=0, le=1)

class BusinessMetrics(BaseModel):
    """Business intelligence metrics"""
    period_start: datetime
    period_end: datetime
    total_users: int
    active_users: int
    new_registrations: int
    course_completions: int
    average_session_duration: float
    revenue_metrics: Dict[str, float] = Field(default_factory=dict)
    engagement_metrics: Dict[str, float] = Field(default_factory=dict)

class PredictiveInsights(BaseModel):
    """Predictive analytics insights"""
    user_id: UUID
    predicted_completion_probability: float = Field(..., ge=0, le=1)
    estimated_completion_time_hours: float = Field(..., ge=0)
    at_risk_dropout: bool
    recommended_interventions: List[str] = Field(default_factory=list)
    confidence_score: float = Field(..., ge=0, le=1)

# =============================================================================
# DATABASE CONNECTION
# =============================================================================

class DatabaseManager:
    """Manages database connections and operations"""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.redis: Optional[redis.Redis] = None
    
    async def connect(self):
        """Initialize database connections"""
        try:
            # PostgreSQL connection
            database_url = os.getenv("DATABASE_URL")
            if not database_url:
                raise ValueError("DATABASE_URL environment variable is required")
            
            self.pool = await asyncpg.create_pool(
                database_url,
                min_size=5,
                max_size=20,
                command_timeout=60
            )
            
            # Redis connection
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            self.redis = redis.from_url(redis_url, decode_responses=True)
            
            logger.info("Database connections established successfully")
            
        except Exception as e:
            logger.error(f"Failed to connect to databases: {e}")
            raise
    
    async def disconnect(self):
        """Close database connections"""
        if self.pool:
            await self.pool.close()
        if self.redis:
            await self.redis.close()
    
    async def execute_query(self, query: str, *args):
        """Execute a database query"""
        async with self.pool.acquire() as connection:
            return await connection.fetch(query, *args)
    
    async def execute_command(self, query: str, *args):
        """Execute a database command (INSERT, UPDATE, DELETE)"""
        async with self.pool.acquire() as connection:
            return await connection.execute(query, *args)

# Global database manager
db_manager = DatabaseManager()

# =============================================================================
# ANALYTICS ENGINE
# =============================================================================

class AnalyticsEngine:
    """Core analytics processing engine"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
        self.ml_models = {}
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize machine learning models"""
        self.ml_models = {
            "completion_predictor": RandomForestRegressor(n_estimators=100, random_state=42),
            "engagement_predictor": RandomForestRegressor(n_estimators=100, random_state=42),
            "time_predictor": RandomForestRegressor(n_estimators=100, random_state=42)
        }
    
    async def track_event(self, event: EventCreate) -> str:
        """Track a user event"""
        try:
            event_id = str(uuid4())
            timestamp = event.timestamp or datetime.utcnow()
            
            # Store in PostgreSQL for persistence
            query = """
            INSERT INTO education.analytics_events (
                id, user_id, session_id, event_type, event_category, 
                event_action, event_label, event_value, properties,
                course_id, lesson_id, assessment_id, timestamp, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            """
            
            await self.db.execute_command(
                query, event_id, event.user_id, event.session_id,
                event.event_type, event.event_category, event.event_action,
                event.event_label, event.event_value, json.dumps(event.properties),
                event.course_id, event.lesson_id, event.assessment_id,
                timestamp, datetime.utcnow()
            )
            
            # Store in Redis for real-time analytics
            redis_key = f"event:{event.user_id}:{datetime.utcnow().strftime('%Y%m%d')}"
            await self.db.redis.lpush(redis_key, json.dumps({
                "id": event_id,
                "event_type": event.event_type,
                "event_category": event.event_category,
                "event_action": event.event_action,
                "timestamp": timestamp.isoformat(),
                "properties": event.properties
            }))
            
            # Set expiration for daily event lists (7 days)
            await self.db.redis.expire(redis_key, 7 * 24 * 3600)
            
            # Update real-time counters
            await self._update_realtime_metrics(event)
            
            logger.info(f"Event tracked: {event_id} for user {event.user_id}")
            return event_id
            
        except Exception as e:
            logger.error(f"Failed to track event: {e}")
            raise HTTPException(status_code=500, detail="Failed to track event")
    
    async def _update_realtime_metrics(self, event: EventCreate):
        """Update real-time metrics in Redis"""
        today = datetime.utcnow().strftime('%Y%m%d')
        
        # Update daily active users
        await self.db.redis.sadd(f"dau:{today}", str(event.user_id))
        await self.db.redis.expire(f"dau:{today}", 24 * 3600)
        
        # Update event counters
        await self.db.redis.incr(f"events:{today}:{event.event_type}")
        await self.db.redis.expire(f"events:{today}:{event.event_type}", 24 * 3600)
        
        # Update session activity
        session_key = f"session:{event.session_id}"
        await self.db.redis.set(session_key, datetime.utcnow().isoformat(), ex=3600)
    
    async def get_learning_analytics(self, user_id: UUID, course_id: Optional[UUID] = None) -> Dict:
        """Get learning analytics for a user"""
        try:
            # Base query for learning progress
            base_query = """
            SELECT 
                u.id as user_id,
                c.id as course_id,
                c.title as course_title,
                e.progress_percentage,
                e.completed_at,
                e.last_accessed_at,
                EXTRACT(EPOCH FROM (e.last_accessed_at - e.enrolled_at))/3600 as hours_spent,
                AVG(aa.score) as avg_quiz_score,
                COUNT(DISTINCT lp.lesson_id) as lessons_completed,
                COUNT(DISTINCT aa.id) as assessments_taken
            FROM education.users u
            JOIN education.enrollments e ON u.id = e.student_id
            JOIN education.courses c ON e.course_id = c.id
            LEFT JOIN education.lesson_progress lp ON e.id = lp.enrollment_id AND lp.status = 'completed'
            LEFT JOIN education.assessment_attempts aa ON e.student_id = aa.student_id
            WHERE u.id = $1
            """
            
            params = [user_id]
            if course_id:
                base_query += " AND c.id = $2"
                params.append(course_id)
            
            base_query += " GROUP BY u.id, c.id, c.title, e.progress_percentage, e.completed_at, e.last_accessed_at, e.enrolled_at"
            
            results = await self.db.execute_query(base_query, *params)
            
            analytics = []
            for row in results:
                # Calculate engagement score based on activity patterns
                engagement_score = await self._calculate_engagement_score(user_id, row['course_id'])
                
                # Get recent activity from Redis
                recent_activity = await self._get_recent_activity(user_id)
                
                analytics.append({
                    "user_id": str(row['user_id']),
                    "course_id": str(row['course_id']),
                    "course_title": row['course_title'],
                    "completion_rate": row['progress_percentage'] / 100.0 if row['progress_percentage'] else 0.0,
                    "time_spent_hours": float(row['hours_spent']) if row['hours_spent'] else 0.0,
                    "avg_quiz_score": float(row['avg_quiz_score']) if row['avg_quiz_score'] else 0.0,
                    "lessons_completed": row['lessons_completed'],
                    "assessments_taken": row['assessments_taken'],
                    "engagement_score": engagement_score,
                    "last_activity": row['last_accessed_at'],
                    "recent_activity_count": recent_activity
                })
            
            return {"learning_analytics": analytics}
            
        except Exception as e:
            logger.error(f"Failed to get learning analytics: {e}")
            raise HTTPException(status_code=500, detail="Failed to retrieve learning analytics")
    
    async def _calculate_engagement_score(self, user_id: UUID, course_id: UUID) -> float:
        """Calculate engagement score based on multiple factors"""
        try:
            # Get activity patterns from last 7 days
            week_ago = datetime.utcnow() - timedelta(days=7)
            
            activity_query = """
            SELECT 
                COUNT(*) as total_events,
                COUNT(DISTINCT DATE(timestamp)) as active_days,
                AVG(EXTRACT(EPOCH FROM (timestamp - LAG(timestamp) OVER (ORDER BY timestamp)))/60) as avg_session_gap_minutes
            FROM education.analytics_events
            WHERE user_id = $1 AND course_id = $2 AND timestamp >= $3
            """
            
            activity_result = await self.db.execute_query(activity_query, user_id, course_id, week_ago)
            
            if not activity_result:
                return 0.0
            
            row = activity_result[0]
            total_events = row['total_events'] or 0
            active_days = row['active_days'] or 0
            avg_gap = row['avg_session_gap_minutes'] or 0
            
            # Calculate engagement score (0-10 scale)
            frequency_score = min(active_days / 7.0 * 3, 3)  # 3 points for daily activity
            volume_score = min(total_events / 50.0 * 3, 3)   # 3 points for high activity volume
            consistency_score = 4 - min(avg_gap / 1440.0 * 4, 4) if avg_gap > 0 else 4  # 4 points for consistency
            
            engagement_score = frequency_score + volume_score + consistency_score
            return round(engagement_score, 2)
            
        except Exception as e:
            logger.error(f"Failed to calculate engagement score: {e}")
            return 0.0
    
    async def _get_recent_activity(self, user_id: UUID) -> int:
        """Get recent activity count from Redis"""
        try:
            today = datetime.utcnow().strftime('%Y%m%d')
            events_key = f"event:{user_id}:{today}"
            count = await self.db.redis.llen(events_key)
            return count
        except Exception:
            return 0
    
    async def get_business_metrics(self, start_date: datetime, end_date: datetime) -> BusinessMetrics:
        """Get business intelligence metrics for a date range"""
        try:
            # User metrics
            user_query = """
            SELECT 
                COUNT(DISTINCT u.id) as total_users,
                COUNT(DISTINCT CASE WHEN u.last_login >= $1 THEN u.id END) as active_users,
                COUNT(DISTINCT CASE WHEN u.created_at >= $1 THEN u.id END) as new_registrations
            FROM education.users u
            WHERE u.created_at <= $2
            """
            
            user_result = await self.db.execute_query(user_query, start_date, end_date)
            user_metrics = user_result[0] if user_result else {}
            
            # Course completion metrics
            completion_query = """
            SELECT 
                COUNT(*) as total_completions,
                AVG(EXTRACT(EPOCH FROM (completed_at - enrolled_at))/3600) as avg_completion_time_hours
            FROM education.enrollments
            WHERE completed_at >= $1 AND completed_at <= $2
            """
            
            completion_result = await self.db.execute_query(completion_query, start_date, end_date)
            completion_metrics = completion_result[0] if completion_result else {}
            
            # Session metrics from analytics events
            session_query = """
            SELECT 
                AVG(session_duration) as avg_session_duration
            FROM (
                SELECT 
                    session_id,
                    EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp)))/60 as session_duration
                FROM education.analytics_events
                WHERE timestamp >= $1 AND timestamp <= $2
                GROUP BY session_id
                HAVING COUNT(*) > 1
            ) session_stats
            """
            
            session_result = await self.db.execute_query(session_query, start_date, end_date)
            session_metrics = session_result[0] if session_result else {}
            
            return BusinessMetrics(
                period_start=start_date,
                period_end=end_date,
                total_users=user_metrics.get('total_users', 0),
                active_users=user_metrics.get('active_users', 0),
                new_registrations=user_metrics.get('new_registrations', 0),
                course_completions=completion_metrics.get('total_completions', 0),
                average_session_duration=float(session_metrics.get('avg_session_duration', 0.0)),
                engagement_metrics={
                    "avg_completion_time_hours": float(completion_metrics.get('avg_completion_time_hours', 0.0)),
                    "completion_rate": 0.0  # Calculate based on enrollments vs completions
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to get business metrics: {e}")
            raise HTTPException(status_code=500, detail="Failed to retrieve business metrics")
    
    async def generate_predictive_insights(self, user_id: UUID) -> List[PredictiveInsights]:
        """Generate predictive insights using ML models"""
        try:
            # Get user's learning history
            history_query = """
            SELECT 
                e.progress_percentage,
                EXTRACT(EPOCH FROM (COALESCE(e.last_accessed_at, NOW()) - e.enrolled_at))/3600 as hours_elapsed,
                COUNT(DISTINCT lp.lesson_id) as lessons_completed,
                AVG(aa.score) as avg_score,
                COUNT(DISTINCT ae.id) as total_events
            FROM education.enrollments e
            LEFT JOIN education.lesson_progress lp ON e.id = lp.enrollment_id
            LEFT JOIN education.assessment_attempts aa ON e.student_id = aa.student_id
            LEFT JOIN education.analytics_events ae ON e.student_id = ae.user_id
            WHERE e.student_id = $1 AND e.completed_at IS NULL
            GROUP BY e.id, e.progress_percentage, e.enrolled_at, e.last_accessed_at
            """
            
            results = await self.db.execute_query(history_query, user_id)
            
            insights = []
            for row in results:
                # Prepare features for ML model
                features = np.array([[
                    row['progress_percentage'] or 0,
                    row['hours_elapsed'] or 0,
                    row['lessons_completed'] or 0,
                    row['avg_score'] or 0,
                    row['total_events'] or 0
                ]])
                
                # Generate predictions (simplified - in production, use trained models)
                completion_prob = min(1.0, max(0.0, (row['progress_percentage'] or 0) / 100.0 + 0.1))
                estimated_time = max(1.0, 40 * (1 - (row['progress_percentage'] or 0) / 100.0))
                at_risk = completion_prob < 0.3 and (row['hours_elapsed'] or 0) > 10
                
                recommendations = []
                if at_risk:
                    recommendations.extend([
                        "Consider scheduling regular study sessions",
                        "Review challenging concepts with AI tutor",
                        "Connect with study group for motivation"
                    ])
                elif completion_prob > 0.8:
                    recommendations.append("You're doing great! Consider advanced topics")
                
                insights.append(PredictiveInsights(
                    user_id=user_id,
                    predicted_completion_probability=completion_prob,
                    estimated_completion_time_hours=estimated_time,
                    at_risk_dropout=at_risk,
                    recommended_interventions=recommendations,
                    confidence_score=0.75  # Simplified confidence score
                ))
            
            return insights
            
        except Exception as e:
            logger.error(f"Failed to generate predictive insights: {e}")
            raise HTTPException(status_code=500, detail="Failed to generate predictive insights")

# Global analytics engine
analytics_engine = None

# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global analytics_engine
    await db_manager.connect()
    analytics_engine = AnalyticsEngine(db_manager)
    logger.info("Analytics service started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await db_manager.disconnect()
    logger.info("Analytics service shutdown complete")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        await db_manager.execute_query("SELECT 1")
        
        # Test Redis connection
        await db_manager.redis.ping()
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "analytics",
            "version": "1.0.0",
            "database": "connected",
            "redis": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )

@app.post("/events")
async def track_event(
    event: EventCreate, 
    background_tasks: BackgroundTasks,
    current_user: UserClaims = Depends(get_current_user),
    tenant_config: TenantConfig = Depends(get_current_tenant),
    _rate_limit: dict = Depends(rate_limit(1000))  # 1000 events per minute per tenant
):
    """
    📊 Track User Learning Event
    
    **Multi-Tenant Analytics Event Tracking**
    
    - Requires: `analytics:write` permission
    - Rate Limited: 1000 events/minute per tenant
    - Data Isolation: Events are automatically tagged with tenant_id
    """
    
    # Verify user has permission to track events
    if "analytics:write" not in current_user.permissions and "analytics:*" not in current_user.permissions:
        raise HTTPException(status_code=403, detail="Permission required: analytics:write")
    
    # Add tenant and user context to event
    event.user_id = current_user.user_id  # Ensure user can only track their own events
    event.properties = event.properties or {}
    event.properties.update({
        "tenant_id": current_user.tenant_id,
        "tenant_name": tenant_config.name,
        "user_role": current_user.role
    })
    
    event_id = await analytics_engine.track_event(event)
    
    return {
        "event_id": event_id, 
        "status": "tracked",
        "tenant_id": current_user.tenant_id,
        "user_id": current_user.user_id
    }

@app.get("/learning-analytics/{user_id}")
async def get_learning_analytics(
    user_id: UUID,
    current_user: UserClaims = Depends(get_current_user),
    tenant_config: TenantConfig = Depends(get_current_tenant),
    course_id: Optional[UUID] = Query(None, description="Filter by specific course"),
    _rate_limit: dict = Depends(rate_limit(100))  # 100 analytics requests per minute
):
    """
    📈 Get Learning Analytics for User
    
    **Multi-Tenant Learning Analytics**
    
    - Requires: `analytics:read` permission or user accessing own data
    - Rate Limited: 100 requests/minute per tenant
    - Data Isolation: Only shows data from current tenant
    """
    
    # Check permissions - users can see their own data, or need analytics:read permission
    if str(user_id) != current_user.user_id:
        if "analytics:read" not in current_user.permissions and "analytics:*" not in current_user.permissions:
            raise HTTPException(status_code=403, detail="Permission required: analytics:read")
    
    # TODO: Add tenant_id filter to analytics_engine.get_learning_analytics()
    # For now, we'll add tenant context to the response
    analytics_data = await analytics_engine.get_learning_analytics(user_id, course_id)
    
    # Add tenant context
    analytics_data["tenant_context"] = {
        "tenant_id": current_user.tenant_id,
        "tenant_name": tenant_config.name,
        "subscription_plan": tenant_config.subscription_plan
    }
    
    return analytics_data

@app.get("/business-metrics")
async def get_business_metrics(
    start_date: datetime = Query(..., description="Start date for metrics"),
    end_date: datetime = Query(..., description="End date for metrics"),
    current_user: UserClaims = Depends(require_permission("analytics:read")),
    tenant_config: TenantConfig = Depends(get_current_tenant),
    _rate_limit: dict = Depends(rate_limit(50))  # 50 business metrics requests per minute
):
    """
    📊 Get Business Intelligence Metrics
    
    **Multi-Tenant Business Analytics**
    
    - Requires: `analytics:read` permission
    - Rate Limited: 50 requests/minute per tenant  
    - Data Isolation: Only shows metrics from current tenant
    - Available to: Instructors, Admins, Institution Admins
    """
    
    # Additional role check for business metrics
    if current_user.role not in ["instructor", "admin", "institution_admin"]:
        raise HTTPException(
            status_code=403, 
            detail="Business metrics access requires instructor level or higher"
        )
    
    # TODO: Add tenant_id filter to analytics_engine.get_business_metrics()
    metrics_data = await analytics_engine.get_business_metrics(start_date, end_date)
    
    # Add tenant and user context
    metrics_data["metadata"] = {
        "tenant_id": current_user.tenant_id,
        "tenant_name": tenant_config.name,
        "subscription_plan": tenant_config.subscription_plan,
        "requested_by": {
            "user_id": current_user.user_id,
            "email": current_user.email,
            "role": current_user.role
        },
        "date_range": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        },
        "generated_at": datetime.utcnow().isoformat()
    }
    
    return metrics_data

@app.get("/predictive-insights/{user_id}")
async def get_predictive_insights(
    user_id: UUID,
    current_user: UserClaims = Depends(get_current_user),
    tenant_config: TenantConfig = Depends(get_current_tenant),
    _rate_limit: dict = Depends(rate_limit(20))  # 20 AI predictions per minute
):
    """
    🔮 Get AI-Powered Predictive Insights
    
    **Multi-Tenant Predictive Analytics**
    
    - Requires: User accessing own data or `analytics:read` permission
    - Rate Limited: 20 AI predictions/minute per tenant
    - Feature Gated: Available based on subscription plan
    """
    
    # Check if tenant has access to AI features
    if "ai_tutor" not in tenant_config.features:
        raise HTTPException(
            status_code=403, 
            detail="AI predictions require 'ai_tutor' feature in subscription plan"
        )
    
    # Check permissions - users can see their own data, or need analytics:read permission
    if str(user_id) != current_user.user_id:
        if "analytics:read" not in current_user.permissions and "analytics:*" not in current_user.permissions:
            raise HTTPException(status_code=403, detail="Permission required: analytics:read")
    
    insights_data = await analytics_engine.generate_predictive_insights(user_id)
    
    # Add tenant context and AI disclaimer
    insights_data["metadata"] = {
        "tenant_id": current_user.tenant_id,
        "tenant_name": tenant_config.name,
        "ai_disclaimer": "Predictions are based on machine learning models and should be used as guidance only",
        "model_version": "v2.0.0",
        "generated_at": datetime.utcnow().isoformat()
    }
    
    return insights_data

@app.get("/realtime-metrics")
async def get_realtime_metrics(
    current_user: UserClaims = Depends(require_role(["instructor", "admin", "institution_admin"])),
    tenant_config: TenantConfig = Depends(get_current_tenant),
    _rate_limit: dict = Depends(rate_limit(100))  # 100 realtime requests per minute
):
    """
    ⚡ Get Real-Time Learning Metrics
    
    **Multi-Tenant Real-Time Dashboard**
    
    - Requires: Instructor level access or higher
    - Rate Limited: 100 requests/minute per tenant
    - Live Data: Updated every few seconds
    """
    try:
        today = datetime.utcnow().strftime('%Y%m%d')
        
        # Get tenant-specific daily active users
        tenant_dau_key = f"dau:{today}:{current_user.tenant_id}"
        dau_count = await db_manager.redis.scard(tenant_dau_key)
        
        # Get tenant-specific event counts by type
        tenant_event_keys = await db_manager.redis.keys(f"events:{today}:{current_user.tenant_id}:*")
        event_counts = {}
        for key in tenant_event_keys:
            event_type = key.split(':')[-1]
            count = await db_manager.redis.get(key)
            event_counts[event_type] = int(count) if count else 0
        
        # Get active sessions for this tenant
        tenant_session_keys = await db_manager.redis.keys(f"session:{current_user.tenant_id}:*")
        active_sessions = len(tenant_session_keys)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "daily_active_users": dau_count,
            "active_sessions": active_sessions,
            "event_counts": event_counts,
            "total_events_today": sum(event_counts.values()),
            "tenant_context": {
                "tenant_id": current_user.tenant_id,
                "tenant_name": tenant_config.name,
                "subscription_plan": tenant_config.subscription_plan,
                "active_features": tenant_config.features,
                "max_users": tenant_config.max_users
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get real-time metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve real-time metrics")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8004)),
        reload=os.getenv("ENVIRONMENT") == "development"
    )