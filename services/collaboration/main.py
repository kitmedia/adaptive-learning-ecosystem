"""
Collaboration Service - Adaptive Learning Ecosystem
EbroValley Digital - Real-time collaboration platform

Advanced collaboration service providing:
- Real-time collaborative editing with WebSockets
- Shared workspaces and sessions
- Live cursors and user presence
- Comment threads and annotations
- Version control and conflict resolution
- Screen sharing and video calls integration
"""

import asyncio
import json
import logging
import os
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Set
from enum import Enum

import asyncpg
import redis.asyncio as redis
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
import jwt

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app initialization
app = FastAPI(
    title="Collaboration Service",
    description="Real-time collaboration system for educational content",
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

class SessionType(str, Enum):
    """Collaboration session types"""
    DOCUMENT = "document"
    WHITEBOARD = "whiteboard"
    VIDEO_CALL = "video_call"
    SCREEN_SHARE = "screen_share"
    CODE = "code"

class ParticipantRole(str, Enum):
    """Participant roles in collaboration"""
    OWNER = "owner"
    EDITOR = "editor"
    VIEWER = "viewer"
    MODERATOR = "moderator"

class OperationType(str, Enum):
    """Operational transformation types"""
    INSERT = "insert"
    DELETE = "delete"
    RETAIN = "retain"
    REPLACE = "replace"
    FORMAT = "format"

class CollaborationSession(BaseModel):
    """Collaboration session model"""
    title: str = Field(..., min_length=1, max_length=200)
    session_type: SessionType
    content_id: Optional[str] = Field(None, description="Associated content ID")
    description: Optional[str] = Field(None, max_length=1000)
    max_participants: int = Field(default=10, ge=1, le=100)
    is_public: bool = Field(default=False)
    password: Optional[str] = Field(None, min_length=4, max_length=50)
    settings: Dict[str, Any] = Field(default_factory=dict)

class SessionParticipant(BaseModel):
    """Session participant model"""
    user_id: str
    display_name: str
    role: ParticipantRole = Field(default=ParticipantRole.VIEWER)
    avatar_url: Optional[str] = None
    permissions: Dict[str, bool] = Field(default_factory=dict)

class Operation(BaseModel):
    """Operational transformation operation"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: OperationType
    position: int = Field(ge=0)
    content: Optional[str] = None
    length: Optional[int] = Field(None, ge=0)
    attributes: Dict[str, Any] = Field(default_factory=dict)
    author_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class CursorPosition(BaseModel):
    """User cursor position"""
    user_id: str
    position: int = Field(ge=0)
    selection_start: Optional[int] = Field(None, ge=0)
    selection_end: Optional[int] = Field(None, ge=0)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Comment(BaseModel):
    """Comment model"""
    content: str = Field(..., min_length=1, max_length=2000)
    position: int = Field(ge=0)
    selection_start: Optional[int] = Field(None, ge=0)
    selection_end: Optional[int] = Field(None, ge=0)
    parent_comment_id: Optional[str] = None

class Annotation(BaseModel):
    """Annotation model"""
    type: str = Field(..., description="highlight, note, question, etc.")
    content: str = Field(..., min_length=1, max_length=1000)
    position: int = Field(ge=0)
    length: int = Field(ge=1)
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    is_private: bool = Field(default=False)

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
# WEBSOCKET CONNECTION MANAGER
# =============================================================================

class ConnectionManager:
    """Manages WebSocket connections for real-time collaboration"""
    
    def __init__(self):
        # session_id -> {user_id -> websocket}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        # session_id -> session_data
        self.sessions: Dict[str, Dict[str, Any]] = {}
        # user_id -> {session_id, cursor_position, last_activity}
        self.user_presence: Dict[str, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str, user_id: str):
        """Connect user to collaboration session"""
        await websocket.accept()
        
        if session_id not in self.active_connections:
            self.active_connections[session_id] = {}
        
        self.active_connections[session_id][user_id] = websocket
        
        # Update user presence
        self.user_presence[user_id] = {
            "session_id": session_id,
            "last_activity": datetime.utcnow(),
            "status": "online"
        }
        
        # Notify other participants
        await self.broadcast_to_session(session_id, {
            "type": "user_joined",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }, exclude_user=user_id)
        
        logger.info(f"User {user_id} connected to session {session_id}")
    
    def disconnect(self, session_id: str, user_id: str):
        """Disconnect user from session"""
        if session_id in self.active_connections:
            if user_id in self.active_connections[session_id]:
                del self.active_connections[session_id][user_id]
            
            # Clean up empty sessions
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
        
        # Update user presence
        if user_id in self.user_presence:
            self.user_presence[user_id]["status"] = "offline"
            self.user_presence[user_id]["last_activity"] = datetime.utcnow()
        
        logger.info(f"User {user_id} disconnected from session {session_id}")
    
    async def send_personal_message(self, message: Dict[str, Any], session_id: str, user_id: str):
        """Send message to specific user"""
        if session_id in self.active_connections and user_id in self.active_connections[session_id]:
            websocket = self.active_connections[session_id][user_id]
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Failed to send message to user {user_id}: {e}")
                self.disconnect(session_id, user_id)
    
    async def broadcast_to_session(self, session_id: str, message: Dict[str, Any], exclude_user: str = None):
        """Broadcast message to all users in session"""
        if session_id not in self.active_connections:
            return
        
        disconnected_users = []
        
        for user_id, websocket in self.active_connections[session_id].items():
            if exclude_user and user_id == exclude_user:
                continue
            
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Failed to broadcast to user {user_id}: {e}")
                disconnected_users.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected_users:
            self.disconnect(session_id, user_id)
    
    def get_session_participants(self, session_id: str) -> List[str]:
        """Get list of active participants in session"""
        if session_id in self.active_connections:
            return list(self.active_connections[session_id].keys())
        return []
    
    def get_user_sessions(self, user_id: str) -> List[str]:
        """Get sessions where user is active"""
        sessions = []
        for session_id, connections in self.active_connections.items():
            if user_id in connections:
                sessions.append(session_id)
        return sessions

# Global connection manager
manager = ConnectionManager()

# =============================================================================
# OPERATIONAL TRANSFORMATION ENGINE
# =============================================================================

class OperationalTransform:
    """Operational transformation for collaborative editing"""
    
    @staticmethod
    def transform_operation(op1: Operation, op2: Operation) -> tuple[Operation, Operation]:
        """Transform two concurrent operations"""
        # Simplified OT implementation
        # In production, use a more sophisticated OT library
        
        if op1.type == OperationType.INSERT and op2.type == OperationType.INSERT:
            if op1.position <= op2.position:
                # op2 position shifts right
                op2_transformed = Operation(
                    id=op2.id,
                    type=op2.type,
                    position=op2.position + len(op1.content or ""),
                    content=op2.content,
                    attributes=op2.attributes,
                    author_id=op2.author_id,
                    timestamp=op2.timestamp
                )
                return op1, op2_transformed
            else:
                # op1 position shifts right
                op1_transformed = Operation(
                    id=op1.id,
                    type=op1.type,
                    position=op1.position + len(op2.content or ""),
                    content=op1.content,
                    attributes=op1.attributes,
                    author_id=op1.author_id,
                    timestamp=op1.timestamp
                )
                return op1_transformed, op2
        
        elif op1.type == OperationType.DELETE and op2.type == OperationType.DELETE:
            # Handle concurrent deletions
            if op1.position == op2.position:
                # Same position, merge deletions
                max_length = max(op1.length or 0, op2.length or 0)
                op1_transformed = Operation(
                    id=op1.id,
                    type=op1.type,
                    position=op1.position,
                    length=max_length,
                    author_id=op1.author_id,
                    timestamp=op1.timestamp
                )
                # op2 becomes no-op
                op2_transformed = Operation(
                    id=op2.id,
                    type=OperationType.RETAIN,
                    position=op2.position,
                    length=0,
                    author_id=op2.author_id,
                    timestamp=op2.timestamp
                )
                return op1_transformed, op2_transformed
        
        # Default: return operations as-is
        return op1, op2
    
    @staticmethod
    def apply_operation(document: str, operation: Operation) -> str:
        """Apply operation to document"""
        try:
            if operation.type == OperationType.INSERT:
                pos = operation.position
                content = operation.content or ""
                return document[:pos] + content + document[pos:]
            
            elif operation.type == OperationType.DELETE:
                pos = operation.position
                length = operation.length or 0
                return document[:pos] + document[pos + length:]
            
            elif operation.type == OperationType.REPLACE:
                pos = operation.position
                length = operation.length or 0
                content = operation.content or ""
                return document[:pos] + content + document[pos + length:]
            
            else:
                return document
                
        except Exception as e:
            logger.error(f"Failed to apply operation: {e}")
            return document

# =============================================================================
# COLLABORATION SERVICE
# =============================================================================

class CollaborationService:
    """Core collaboration service"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
        self.ot = OperationalTransform()
    
    async def create_session(self, session_data: CollaborationSession, creator_id: str) -> Dict[str, Any]:
        """Create new collaboration session"""
        try:
            session_id = str(uuid.uuid4())
            now = datetime.utcnow()
            
            # Store session in database
            query = """
            INSERT INTO education.collaboration_sessions (
                id, title, session_type, content_id, description, creator_id,
                max_participants, is_public, password_hash, settings,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
            """
            
            # Simple password hashing (use proper hashing in production)
            password_hash = session_data.password if session_data.password else None
            
            result = await self.db.execute_query(
                query,
                session_id, session_data.title, session_data.session_type.value,
                session_data.content_id, session_data.description, creator_id,
                session_data.max_participants, session_data.is_public,
                password_hash, json.dumps(session_data.settings), now, now
            )
            
            if result:
                session = dict(result[0])
                
                # Add creator as owner
                await self._add_participant(session_id, creator_id, ParticipantRole.OWNER)
                
                # Initialize session document in Redis
                await self.db.redis.set(f"session:{session_id}:document", "")
                await self.db.redis.set(f"session:{session_id}:operations", json.dumps([]))
                
                logger.info(f"Collaboration session created: {session_id}")
                return session
            else:
                raise HTTPException(status_code=500, detail="Failed to create session")
                
        except Exception as e:
            logger.error(f"Failed to create collaboration session: {e}")
            raise HTTPException(status_code=500, detail="Failed to create session")
    
    async def join_session(self, session_id: str, user_id: str, password: str = None) -> Dict[str, Any]:
        """Join collaboration session"""
        try:
            # Get session info
            session = await self._get_session(session_id)
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
            
            # Check password if required
            if session.get('password_hash') and session['password_hash'] != password:
                raise HTTPException(status_code=403, detail="Invalid password")
            
            # Check participant limit
            current_participants = await self._get_session_participants(session_id)
            if len(current_participants) >= session['max_participants']:
                raise HTTPException(status_code=403, detail="Session is full")
            
            # Add user as participant
            await self._add_participant(session_id, user_id, ParticipantRole.VIEWER)
            
            # Get current document state
            document = await self.db.redis.get(f"session:{session_id}:document") or ""
            
            return {
                "session_id": session_id,
                "session": session,
                "document": document,
                "participants": current_participants,
                "role": "viewer"
            }
            
        except Exception as e:
            logger.error(f"Failed to join session: {e}")
            raise HTTPException(status_code=500, detail="Failed to join session")
    
    async def process_operation(self, session_id: str, operation: Operation) -> Dict[str, Any]:
        """Process collaborative operation"""
        try:
            # Get current document
            document = await self.db.redis.get(f"session:{session_id}:document") or ""
            
            # Apply operation
            new_document = self.ot.apply_operation(document, operation)
            
            # Store updated document
            await self.db.redis.set(f"session:{session_id}:document", new_document)
            
            # Store operation in history
            operations_json = await self.db.redis.get(f"session:{session_id}:operations") or "[]"
            operations = json.loads(operations_json)
            operations.append(operation.dict())
            await self.db.redis.set(f"session:{session_id}:operations", json.dumps(operations))
            
            # Broadcast operation to other participants
            await manager.broadcast_to_session(session_id, {
                "type": "operation",
                "operation": operation.dict(),
                "document": new_document
            }, exclude_user=operation.author_id)
            
            return {
                "success": True,
                "document": new_document,
                "operation_id": operation.id
            }
            
        except Exception as e:
            logger.error(f"Failed to process operation: {e}")
            raise HTTPException(status_code=500, detail="Failed to process operation")
    
    async def update_cursor(self, session_id: str, cursor: CursorPosition):
        """Update user cursor position"""
        try:
            # Store cursor position in Redis
            await self.db.redis.setex(
                f"session:{session_id}:cursor:{cursor.user_id}",
                30,  # 30 seconds TTL
                json.dumps(cursor.dict())
            )
            
            # Broadcast cursor update
            await manager.broadcast_to_session(session_id, {
                "type": "cursor_update",
                "cursor": cursor.dict()
            }, exclude_user=cursor.user_id)
            
        except Exception as e:
            logger.error(f"Failed to update cursor: {e}")
    
    async def add_comment(self, session_id: str, comment: Comment, author_id: str) -> Dict[str, Any]:
        """Add comment to session"""
        try:
            comment_id = str(uuid.uuid4())
            now = datetime.utcnow()
            
            query = """
            INSERT INTO education.collaboration_comments (
                id, session_id, author_id, content, position,
                selection_start, selection_end, parent_comment_id, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
            """
            
            result = await self.db.execute_query(
                query,
                comment_id, session_id, author_id, comment.content,
                comment.position, comment.selection_start, comment.selection_end,
                comment.parent_comment_id, now
            )
            
            if result:
                comment_data = dict(result[0])
                
                # Broadcast comment to session
                await manager.broadcast_to_session(session_id, {
                    "type": "comment_added",
                    "comment": comment_data
                })
                
                return comment_data
            else:
                raise HTTPException(status_code=500, detail="Failed to add comment")
                
        except Exception as e:
            logger.error(f"Failed to add comment: {e}")
            raise HTTPException(status_code=500, detail="Failed to add comment")
    
    async def _get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session information"""
        try:
            query = """
            SELECT * FROM education.collaboration_sessions WHERE id = $1
            """
            result = await self.db.execute_query(query, session_id)
            return dict(result[0]) if result else None
        except Exception as e:
            logger.error(f"Failed to get session: {e}")
            return None
    
    async def _get_session_participants(self, session_id: str) -> List[Dict[str, Any]]:
        """Get session participants"""
        try:
            query = """
            SELECT cp.*, u.full_name, u.email, u.avatar_url
            FROM education.collaboration_participants cp
            JOIN education.users u ON cp.user_id = u.id
            WHERE cp.session_id = $1 AND cp.is_active = true
            """
            result = await self.db.execute_query(query, session_id)
            return [dict(row) for row in result]
        except Exception as e:
            logger.error(f"Failed to get session participants: {e}")
            return []
    
    async def _add_participant(self, session_id: str, user_id: str, role: ParticipantRole):
        """Add participant to session"""
        try:
            query = """
            INSERT INTO education.collaboration_participants (
                id, session_id, user_id, role, joined_at, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (session_id, user_id) 
            DO UPDATE SET role = $3, is_active = true, rejoined_at = NOW()
            """
            
            await self.db.execute_command(
                query,
                str(uuid.uuid4()), session_id, user_id, role.value,
                datetime.utcnow(), True
            )
        except Exception as e:
            logger.error(f"Failed to add participant: {e}")

# Global collaboration service
collaboration_service = None

# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global collaboration_service
    await db_manager.connect()
    collaboration_service = CollaborationService(db_manager)
    logger.info("Collaboration service started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await db_manager.disconnect()
    logger.info("Collaboration service shutdown complete")

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
            "service": "collaboration",
            "version": "1.0.0",
            "database": "connected",
            "redis": "connected",
            "active_sessions": len(manager.active_connections)
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

@app.post("/sessions")
async def create_session(
    session: CollaborationSession,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Create new collaboration session"""
    user_id = "user123"  # Extract from JWT token
    return await collaboration_service.create_session(session, user_id)

@app.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Get session information"""
    session = await collaboration_service._get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    participants = await collaboration_service._get_session_participants(session_id)
    active_participants = manager.get_session_participants(session_id)
    
    return {
        "session": session,
        "participants": participants,
        "active_participants": active_participants,
        "participant_count": len(active_participants)
    }

@app.post("/sessions/{session_id}/join")
async def join_session(
    session_id: str,
    password: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Join collaboration session"""
    user_id = "user123"  # Extract from JWT token
    return await collaboration_service.join_session(session_id, user_id, password)

@app.websocket("/ws/collaborate/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time collaboration"""
    # In production, validate JWT token from query params or headers
    user_id = websocket.query_params.get("user_id", "anonymous")
    
    await manager.connect(websocket, session_id, user_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            message_type = message.get("type")
            
            if message_type == "operation":
                # Process collaborative operation
                operation = Operation(**message["operation"])
                await collaboration_service.process_operation(session_id, operation)
                
            elif message_type == "cursor":
                # Update cursor position
                cursor = CursorPosition(**message["cursor"])
                await collaboration_service.update_cursor(session_id, cursor)
                
            elif message_type == "ping":
                # Keep-alive ping
                await websocket.send_text(json.dumps({"type": "pong"}))
                
            else:
                # Echo unknown messages
                await manager.broadcast_to_session(session_id, message, exclude_user=user_id)
                
    except WebSocketDisconnect:
        manager.disconnect(session_id, user_id)
        await manager.broadcast_to_session(session_id, {
            "type": "user_left",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8008)),
        reload=os.getenv("ENVIRONMENT") == "development"
    )