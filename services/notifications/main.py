"""
Notifications Service - Adaptive Learning Ecosystem
EbroValley Digital - Multi-channel notification system

Advanced notification service providing:
- Email notifications with templates
- SMS notifications via Twilio
- Push notifications to mobile devices
- Real-time notifications via WebSocket
- Notification preferences and scheduling
"""

import asyncio
import json
import logging
import os
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from enum import Enum

import asyncpg
import redis.asyncio as redis
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from twilio.rest import Client as TwilioClient
import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app initialization
app = FastAPI(
    title="Notifications Service",
    description="Multi-channel notification system for educational platform",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None
)

# Security
security = HTTPBearer()

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

class NotificationType(str, Enum):
    """Notification types"""
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    IN_APP = "in_app"
    WEBHOOK = "webhook"

class NotificationStatus(str, Enum):
    """Notification status"""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    CANCELLED = "cancelled"

class NotificationPriority(str, Enum):
    """Notification priority levels"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class NotificationTemplate(BaseModel):
    """Notification template model"""
    name: str = Field(..., min_length=1, max_length=100)
    subject: Optional[str] = Field(None, max_length=200)
    body: str = Field(..., min_length=1)
    template_type: NotificationType
    variables: List[str] = Field(default_factory=list)
    is_active: bool = Field(default=True)

class NotificationRequest(BaseModel):
    """Notification request model"""
    recipient_id: str = Field(..., description="User ID or identifier")
    notification_type: NotificationType
    subject: Optional[str] = Field(None, max_length=200)
    message: str = Field(..., min_length=1)
    data: Dict[str, Any] = Field(default_factory=dict)
    priority: NotificationPriority = Field(default=NotificationPriority.NORMAL)
    schedule_at: Optional[datetime] = Field(None, description="Schedule for later delivery")
    template_name: Optional[str] = Field(None, description="Template to use")
    template_variables: Dict[str, str] = Field(default_factory=dict)

class BulkNotificationRequest(BaseModel):
    """Bulk notification request model"""
    recipient_ids: List[str] = Field(..., min_items=1, max_items=1000)
    notification_type: NotificationType
    subject: Optional[str] = Field(None, max_length=200)
    message: str = Field(..., min_length=1)
    data: Dict[str, Any] = Field(default_factory=dict)
    priority: NotificationPriority = Field(default=NotificationPriority.NORMAL)
    template_name: Optional[str] = Field(None)
    template_variables: Dict[str, str] = Field(default_factory=dict)

class NotificationPreferences(BaseModel):
    """User notification preferences"""
    user_id: str
    email_enabled: bool = Field(default=True)
    sms_enabled: bool = Field(default=False)
    push_enabled: bool = Field(default=True)
    in_app_enabled: bool = Field(default=True)
    quiet_hours_start: Optional[str] = Field(None, pattern=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    quiet_hours_end: Optional[str] = Field(None, pattern=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    timezone: str = Field(default="UTC")

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
# NOTIFICATION ENGINES
# =============================================================================

class EmailEngine:
    """Email notification engine"""
    
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "localhost")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("FROM_EMAIL", "noreply@adaptive-learning.com")
    
    async def send_email(self, to_email: str, subject: str, body: str, is_html: bool = False) -> bool:
        """Send email notification"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'html' if is_html else 'plain'))
            
            # Use asyncio to run SMTP in thread pool
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._send_smtp, msg, to_email)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    def _send_smtp(self, msg, to_email):
        """Send email via SMTP (blocking)"""
        with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
            server.starttls()
            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)
            server.send_message(msg, to_addresses=[to_email])

class SMSEngine:
    """SMS notification engine via Twilio"""
    
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = os.getenv("TWILIO_FROM_NUMBER")
        
        if self.account_sid and self.auth_token:
            self.client = TwilioClient(self.account_sid, self.auth_token)
        else:
            self.client = None
            logger.warning("Twilio credentials not configured - SMS disabled")
    
    async def send_sms(self, to_phone: str, message: str) -> bool:
        """Send SMS notification"""
        if not self.client:
            logger.error("SMS client not configured")
            return False
        
        try:
            # Run Twilio call in thread pool
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._send_twilio_sms, to_phone, message)
            
            logger.info(f"SMS sent successfully to {to_phone}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send SMS to {to_phone}: {e}")
            return False
    
    def _send_twilio_sms(self, to_phone: str, message: str):
        """Send SMS via Twilio (blocking)"""
        self.client.messages.create(
            body=message,
            from_=self.from_number,
            to=to_phone
        )

class PushNotificationEngine:
    """Push notification engine"""
    
    def __init__(self):
        self.firebase_server_key = os.getenv("FIREBASE_SERVER_KEY")
        self.fcm_url = "https://fcm.googleapis.com/fcm/send"
    
    async def send_push(self, device_token: str, title: str, body: str, data: Dict[str, Any] = None) -> bool:
        """Send push notification via Firebase"""
        if not self.firebase_server_key:
            logger.warning("Firebase server key not configured - Push notifications disabled")
            return False
        
        try:
            payload = {
                "to": device_token,
                "notification": {
                    "title": title,
                    "body": body
                },
                "data": data or {}
            }
            
            headers = {
                "Authorization": f"key={self.firebase_server_key}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(self.fcm_url, json=payload, headers=headers)
                response.raise_for_status()
            
            logger.info(f"Push notification sent successfully to {device_token}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send push notification to {device_token}: {e}")
            return False

# =============================================================================
# NOTIFICATION SERVICE
# =============================================================================

class NotificationService:
    """Core notification service"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
        self.email_engine = EmailEngine()
        self.sms_engine = SMSEngine()
        self.push_engine = PushNotificationEngine()
    
    async def send_notification(self, request: NotificationRequest) -> Dict[str, Any]:
        """Send a single notification"""
        try:
            notification_id = str(uuid.uuid4())
            
            # Get user contact information
            user_info = await self._get_user_info(request.recipient_id)
            if not user_info:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Check user preferences
            preferences = await self._get_user_preferences(request.recipient_id)
            if not self._should_send_notification(request.notification_type, preferences):
                logger.info(f"Notification blocked by user preferences: {request.recipient_id}")
                return {"notification_id": notification_id, "status": "blocked", "reason": "User preferences"}
            
            # Process template if specified
            subject, message = await self._process_template(request)
            
            # Store notification in database
            await self._store_notification(notification_id, request, user_info)
            
            # Send notification based on type
            success = False
            if request.notification_type == NotificationType.EMAIL:
                success = await self.email_engine.send_email(
                    user_info.get('email'), subject or "Notification", message
                )
            elif request.notification_type == NotificationType.SMS:
                success = await self.sms_engine.send_sms(
                    user_info.get('phone'), message
                )
            elif request.notification_type == NotificationType.PUSH:
                success = await self.push_engine.send_push(
                    user_info.get('device_token'), subject or "Notification", message, request.data
                )
            elif request.notification_type == NotificationType.IN_APP:
                success = await self._send_in_app_notification(request.recipient_id, subject, message, request.data)
            
            # Update notification status
            status = NotificationStatus.SENT if success else NotificationStatus.FAILED
            await self._update_notification_status(notification_id, status)
            
            return {
                "notification_id": notification_id,
                "status": status.value,
                "sent_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to send notification: {e}")
            raise HTTPException(status_code=500, detail="Failed to send notification")
    
    async def send_bulk_notifications(self, request: BulkNotificationRequest) -> Dict[str, Any]:
        """Send bulk notifications"""
        try:
            batch_id = str(uuid.uuid4())
            results = []
            
            for recipient_id in request.recipient_ids:
                individual_request = NotificationRequest(
                    recipient_id=recipient_id,
                    notification_type=request.notification_type,
                    subject=request.subject,
                    message=request.message,
                    data=request.data,
                    priority=request.priority,
                    template_name=request.template_name,
                    template_variables=request.template_variables
                )
                
                try:
                    result = await self.send_notification(individual_request)
                    results.append({"recipient_id": recipient_id, "result": result})
                except Exception as e:
                    results.append({"recipient_id": recipient_id, "error": str(e)})
            
            successful = len([r for r in results if "error" not in r])
            failed = len(results) - successful
            
            return {
                "batch_id": batch_id,
                "total": len(request.recipient_ids),
                "successful": successful,
                "failed": failed,
                "results": results
            }
            
        except Exception as e:
            logger.error(f"Failed to send bulk notifications: {e}")
            raise HTTPException(status_code=500, detail="Failed to send bulk notifications")
    
    async def _get_user_info(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user contact information"""
        try:
            query = """
            SELECT id, email, phone, device_token, full_name, timezone
            FROM education.users 
            WHERE id = $1
            """
            result = await self.db.execute_query(query, user_id)
            return dict(result[0]) if result else None
        except Exception as e:
            logger.error(f"Failed to get user info: {e}")
            return None
    
    async def _get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get user notification preferences"""
        try:
            query = """
            SELECT email_enabled, sms_enabled, push_enabled, in_app_enabled,
                   quiet_hours_start, quiet_hours_end, timezone
            FROM education.notification_preferences 
            WHERE user_id = $1
            """
            result = await self.db.execute_query(query, user_id)
            if result:
                return dict(result[0])
            else:
                # Return default preferences
                return {
                    "email_enabled": True,
                    "sms_enabled": False,
                    "push_enabled": True,
                    "in_app_enabled": True,
                    "quiet_hours_start": None,
                    "quiet_hours_end": None,
                    "timezone": "UTC"
                }
        except Exception as e:
            logger.error(f"Failed to get user preferences: {e}")
            return {}
    
    async def _should_send_notification(self, notification_type: NotificationType, preferences: Dict[str, Any]) -> bool:
        """Check if notification should be sent based on user preferences"""
        type_mapping = {
            NotificationType.EMAIL: "email_enabled",
            NotificationType.SMS: "sms_enabled",
            NotificationType.PUSH: "push_enabled",
            NotificationType.IN_APP: "in_app_enabled"
        }
        
        preference_key = type_mapping.get(notification_type)
        if preference_key and not preferences.get(preference_key, True):
            return False
        
        # Check quiet hours
        # TODO: Implement quiet hours logic
        
        return True
    
    async def _process_template(self, request: NotificationRequest) -> tuple[str, str]:
        """Process notification template"""
        if not request.template_name:
            return request.subject, request.message
        
        try:
            # Get template from database
            query = """
            SELECT subject, body, variables
            FROM education.notification_templates
            WHERE name = $1 AND template_type = $2 AND is_active = true
            """
            result = await self.db.execute_query(query, request.template_name, request.notification_type.value)
            
            if not result:
                logger.warning(f"Template not found: {request.template_name}")
                return request.subject, request.message
            
            template = dict(result[0])
            subject = template['subject'] or ""
            body = template['body']
            
            # Replace variables
            for var_name, var_value in request.template_variables.items():
                placeholder = f"{{{{{var_name}}}}}"
                subject = subject.replace(placeholder, var_value)
                body = body.replace(placeholder, var_value)
            
            return subject, body
            
        except Exception as e:
            logger.error(f"Failed to process template: {e}")
            return request.subject, request.message
    
    async def _store_notification(self, notification_id: str, request: NotificationRequest, user_info: Dict[str, Any]):
        """Store notification in database"""
        try:
            query = """
            INSERT INTO education.notifications (
                id, recipient_id, notification_type, subject, message, data,
                priority, status, created_at, scheduled_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            """
            await self.db.execute_command(
                query,
                notification_id, request.recipient_id, request.notification_type.value,
                request.subject, request.message, json.dumps(request.data),
                request.priority.value, NotificationStatus.PENDING.value,
                datetime.utcnow(), request.schedule_at
            )
        except Exception as e:
            logger.error(f"Failed to store notification: {e}")
    
    async def _update_notification_status(self, notification_id: str, status: NotificationStatus):
        """Update notification status"""
        try:
            query = """
            UPDATE education.notifications 
            SET status = $1, sent_at = CASE WHEN $1 = 'sent' THEN NOW() ELSE sent_at END,
                delivered_at = CASE WHEN $1 = 'delivered' THEN NOW() ELSE delivered_at END
            WHERE id = $2
            """
            await self.db.execute_command(query, status.value, notification_id)
        except Exception as e:
            logger.error(f"Failed to update notification status: {e}")
    
    async def _send_in_app_notification(self, user_id: str, title: str, message: str, data: Dict[str, Any]) -> bool:
        """Send in-app notification via Redis"""
        try:
            notification_data = {
                "id": str(uuid.uuid4()),
                "title": title,
                "message": message,
                "data": data,
                "timestamp": datetime.utcnow().isoformat(),
                "read": False
            }
            
            # Store in Redis for real-time delivery
            await self.db.redis.lpush(f"notifications:{user_id}", json.dumps(notification_data))
            await self.db.redis.expire(f"notifications:{user_id}", 86400 * 7)  # 7 days
            
            # Publish to real-time channel
            await self.db.redis.publish(f"user:{user_id}:notifications", json.dumps(notification_data))
            
            return True
        except Exception as e:
            logger.error(f"Failed to send in-app notification: {e}")
            return False

# Global notification service
notification_service = None

# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global notification_service
    await db_manager.connect()
    notification_service = NotificationService(db_manager)
    logger.info("Notifications service started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await db_manager.disconnect()
    logger.info("Notifications service shutdown complete")

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
            "service": "notifications",
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

@app.post("/notifications/send")
async def send_notification(
    request: NotificationRequest,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Send a single notification"""
    if request.schedule_at and request.schedule_at > datetime.utcnow():
        # Schedule for later
        background_tasks.add_task(
            _schedule_notification, request, 
            (request.schedule_at - datetime.utcnow()).total_seconds()
        )
        return {"message": "Notification scheduled", "schedule_at": request.schedule_at.isoformat()}
    else:
        return await notification_service.send_notification(request)

@app.post("/notifications/send-bulk")
async def send_bulk_notifications(
    request: BulkNotificationRequest,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Send bulk notifications"""
    background_tasks.add_task(notification_service.send_bulk_notifications, request)
    return {"message": "Bulk notifications queued", "recipients": len(request.recipient_ids)}

@app.get("/notifications/{user_id}")
async def get_user_notifications(
    user_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get user notifications"""
    try:
        query = """
        SELECT id, notification_type, subject, message, data, priority, status,
               created_at, sent_at, delivered_at
        FROM education.notifications
        WHERE recipient_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        """
        
        result = await db_manager.execute_query(query, user_id, limit, offset)
        notifications = [dict(row) for row in result]
        
        return {
            "notifications": notifications,
            "total": len(notifications),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Failed to get user notifications: {e}")
        raise HTTPException(status_code=500, detail="Failed to get notifications")

async def _schedule_notification(request: NotificationRequest, delay_seconds: float):
    """Schedule notification for later delivery"""
    await asyncio.sleep(delay_seconds)
    await notification_service.send_notification(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8007)),
        reload=os.getenv("ENVIRONMENT") == "development"
    )