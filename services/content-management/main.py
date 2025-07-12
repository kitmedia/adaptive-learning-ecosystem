"""
Content Management Service - Adaptive Learning Ecosystem
EbroValley Digital - Educational Content Management System

Advanced content management service providing:
- Course and lesson content creation/editing
- Rich media management (video, audio, documents)
- Content versioning and collaboration
- SCORM compliance and LTI integration
- AI-powered content analysis and optimization
"""

import asyncio
import json
import logging
import os
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from enum import Enum
from pathlib import Path
import mimetypes
import hashlib

import asyncpg
import redis.asyncio as redis
import aiofiles
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
import boto3
from botocore.exceptions import ClientError
from PIL import Image
import ffmpeg
# import textract  # Replaced with specific libraries
from PyPDF2 import PdfReader
from docx import Document
from pptx import Presentation
import magic
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
import tiktoken

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app initialization
app = FastAPI(
    title="Content Management Service",
    description="Advanced content management system for educational content",
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

class ContentType(str, Enum):
    """Enum for content types"""
    COURSE = "course"
    MODULE = "module"
    LESSON = "lesson"
    ASSESSMENT = "assessment"
    RESOURCE = "resource"
    SCORM = "scorm"

class ContentStatus(str, Enum):
    """Enum for content status"""
    DRAFT = "draft"
    REVIEW = "review"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class MediaType(str, Enum):
    """Enum for media types"""
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"
    PRESENTATION = "presentation"
    INTERACTIVE = "interactive"

class ContentCreate(BaseModel):
    """Model for creating content"""
    title: str = Field(..., min_length=1, max_length=255)
    content_type: ContentType
    description: Optional[str] = Field(None, max_length=1000)
    content_body: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    category: Optional[str] = None
    difficulty_level: Optional[str] = Field(None, pattern="^(beginner|intermediate|advanced)$")
    estimated_duration: Optional[int] = Field(None, ge=1)  # in minutes
    language: str = Field(default="en")
    parent_id: Optional[str] = None
    prerequisites: List[str] = Field(default_factory=list)
    learning_objectives: List[str] = Field(default_factory=list)
    
    @validator('tags')
    def validate_tags(cls, v):
        return [tag.strip().lower() for tag in v if tag.strip()]

class ContentUpdate(BaseModel):
    """Model for updating content"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    content_body: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    difficulty_level: Optional[str] = Field(None, pattern="^(beginner|intermediate|advanced)$")
    estimated_duration: Optional[int] = Field(None, ge=1)
    language: Optional[str] = None
    prerequisites: Optional[List[str]] = None
    learning_objectives: Optional[List[str]] = None
    status: Optional[ContentStatus] = None

class MediaUpload(BaseModel):
    """Model for media upload metadata"""
    title: str
    description: Optional[str] = None
    media_type: MediaType
    content_id: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    alt_text: Optional[str] = None
    transcript: Optional[str] = None

class ContentVersion(BaseModel):
    """Model for content versioning"""
    content_id: str
    version_number: int
    title: str
    content_body: str
    metadata: Dict[str, Any]
    created_by: str
    created_at: datetime
    change_summary: Optional[str] = None

class CollaborationSession(BaseModel):
    """Model for real-time collaboration"""
    content_id: str
    user_id: str
    session_id: str
    cursor_position: Optional[int] = None
    selected_text: Optional[str] = None
    last_activity: datetime

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
# STORAGE MANAGER
# =============================================================================

class StorageManager:
    """Manages file storage (local and cloud)"""
    
    def __init__(self):
        self.local_storage_path = Path(os.getenv("UPLOAD_PATH", "./uploads"))
        self.local_storage_path.mkdir(exist_ok=True)
        
        # AWS S3 configuration
        self.use_s3 = os.getenv("USE_S3", "false").lower() == "true"
        if self.use_s3:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                region_name=os.getenv("AWS_REGION", "us-east-1")
            )
            self.s3_bucket = os.getenv("AWS_S3_BUCKET")
    
    async def save_file(self, file: UploadFile, file_path: str) -> Dict[str, Any]:
        """Save file to storage"""
        try:
            # Generate unique filename
            file_id = str(uuid.uuid4())
            file_extension = Path(file.filename).suffix.lower()
            filename = f"{file_id}{file_extension}"
            
            # Calculate file hash
            file_content = await file.read()
            file_hash = hashlib.sha256(file_content).hexdigest()
            
            # Reset file pointer
            await file.seek(0)
            
            if self.use_s3:
                # Upload to S3
                s3_key = f"{file_path}/{filename}"
                self.s3_client.put_object(
                    Bucket=self.s3_bucket,
                    Key=s3_key,
                    Body=file_content,
                    ContentType=file.content_type
                )
                file_url = f"https://{self.s3_bucket}.s3.amazonaws.com/{s3_key}"
            else:
                # Save locally
                local_path = self.local_storage_path / file_path
                local_path.mkdir(parents=True, exist_ok=True)
                file_location = local_path / filename
                
                async with aiofiles.open(file_location, 'wb') as f:
                    await f.write(file_content)
                
                file_url = f"/files/{file_path}/{filename}"
            
            return {
                "file_id": file_id,
                "filename": filename,
                "original_filename": file.filename,
                "file_url": file_url,
                "file_size": len(file_content),
                "content_type": file.content_type,
                "file_hash": file_hash
            }
            
        except Exception as e:
            logger.error(f"Failed to save file: {e}")
            raise HTTPException(status_code=500, detail="Failed to save file")
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete file from storage"""
        try:
            if self.use_s3:
                self.s3_client.delete_object(Bucket=self.s3_bucket, Key=file_path)
            else:
                local_file = self.local_storage_path / file_path
                if local_file.exists():
                    local_file.unlink()
            return True
        except Exception as e:
            logger.error(f"Failed to delete file: {e}")
            return False
    
    async def get_file_info(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Get file information"""
        try:
            if self.use_s3:
                response = self.s3_client.head_object(Bucket=self.s3_bucket, Key=file_path)
                return {
                    "size": response['ContentLength'],
                    "content_type": response['ContentType'],
                    "last_modified": response['LastModified']
                }
            else:
                local_file = self.local_storage_path / file_path
                if local_file.exists():
                    stat = local_file.stat()
                    return {
                        "size": stat.st_size,
                        "content_type": mimetypes.guess_type(str(local_file))[0],
                        "last_modified": datetime.fromtimestamp(stat.st_mtime)
                    }
            return None
        except Exception as e:
            logger.error(f"Failed to get file info: {e}")
            return None

# Global storage manager
storage_manager = StorageManager()

# =============================================================================
# CONTENT MANAGEMENT ENGINE
# =============================================================================

class ContentManagementEngine:
    """Core content management engine"""
    
    def __init__(self, db_manager: DatabaseManager, storage_manager: StorageManager):
        self.db = db_manager
        self.storage = storage_manager
        self.embeddings = OpenAIEmbeddings() if os.getenv("OPENAI_API_KEY") else None
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
    
    async def create_content(self, content_data: ContentCreate, user_id: str) -> Dict[str, Any]:
        """Create new content"""
        try:
            content_id = str(uuid.uuid4())
            now = datetime.utcnow()
            
            # Generate content embeddings if available
            embeddings = None
            if self.embeddings and content_data.content_body:
                try:
                    embeddings = await self._generate_embeddings(content_data.content_body)
                except Exception as e:
                    logger.warning(f"Failed to generate embeddings: {e}")
            
            # Insert content into database
            query = """
            INSERT INTO education.content (
                id, title, content_type, description, content_body, metadata,
                tags, category, difficulty_level, estimated_duration, language,
                parent_id, prerequisites, learning_objectives, embeddings,
                status, created_by, created_at, updated_at, version
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            RETURNING *
            """
            
            result = await self.db.execute_query(
                query,
                content_id, content_data.title, content_data.content_type,
                content_data.description, content_data.content_body,
                json.dumps(content_data.metadata), content_data.tags,
                content_data.category, content_data.difficulty_level,
                content_data.estimated_duration, content_data.language,
                content_data.parent_id, content_data.prerequisites,
                content_data.learning_objectives, embeddings,
                ContentStatus.DRAFT, user_id, now, now, 1
            )
            
            if result:
                content = dict(result[0])
                
                # Create initial version
                await self._create_version(content_id, content, user_id, "Initial version")
                
                # Index for search
                await self._index_content(content_id, content_data)
                
                logger.info(f"Content created: {content_id}")
                return content
            else:
                raise HTTPException(status_code=500, detail="Failed to create content")
                
        except Exception as e:
            logger.error(f"Failed to create content: {e}")
            raise HTTPException(status_code=500, detail="Failed to create content")
    
    async def update_content(self, content_id: str, content_data: ContentUpdate, user_id: str) -> Dict[str, Any]:
        """Update existing content"""
        try:
            # Get current content
            current_content = await self.get_content_by_id(content_id)
            if not current_content:
                raise HTTPException(status_code=404, detail="Content not found")
            
            # Build update query dynamically
            update_fields = []
            update_values = []
            param_count = 1
            
            for field, value in content_data.dict(exclude_unset=True).items():
                if field == "metadata":
                    update_fields.append(f"metadata = ${param_count}")
                    update_values.append(json.dumps(value))
                elif field == "tags":
                    update_fields.append(f"tags = ${param_count}")
                    update_values.append(value)
                elif field == "prerequisites":
                    update_fields.append(f"prerequisites = ${param_count}")
                    update_values.append(value)
                elif field == "learning_objectives":
                    update_fields.append(f"learning_objectives = ${param_count}")
                    update_values.append(value)
                else:
                    update_fields.append(f"{field} = ${param_count}")
                    update_values.append(value)
                param_count += 1
            
            # Add updated_at and version
            update_fields.extend([f"updated_at = ${param_count}", f"version = ${param_count + 1}"])
            update_values.extend([datetime.utcnow(), current_content['version'] + 1])
            update_values.append(content_id)
            
            query = f"""
            UPDATE education.content 
            SET {', '.join(update_fields)}
            WHERE id = ${param_count + 2}
            RETURNING *
            """
            
            result = await self.db.execute_query(query, *update_values)
            
            if result:
                updated_content = dict(result[0])
                
                # Create new version
                await self._create_version(content_id, updated_content, user_id, "Content update")
                
                # Update search index
                await self._index_content(content_id, updated_content)
                
                logger.info(f"Content updated: {content_id}")
                return updated_content
            else:
                raise HTTPException(status_code=500, detail="Failed to update content")
                
        except Exception as e:
            logger.error(f"Failed to update content: {e}")
            raise HTTPException(status_code=500, detail="Failed to update content")
    
    async def get_content_by_id(self, content_id: str) -> Optional[Dict[str, Any]]:
        """Get content by ID"""
        try:
            query = """
            SELECT c.*, u.email as created_by_email,
                   COUNT(DISTINCT v.id) as version_count,
                   MAX(v.created_at) as last_version_at
            FROM education.content c
            LEFT JOIN education.users u ON c.created_by = u.id
            LEFT JOIN education.content_versions v ON c.id = v.content_id
            WHERE c.id = $1
            GROUP BY c.id, u.email
            """
            
            result = await self.db.execute_query(query, content_id)
            
            if result:
                content = dict(result[0])
                
                # Get media files
                media_query = """
                SELECT id, filename, original_filename, file_url, media_type, 
                       file_size, content_type, created_at
                FROM education.media_files
                WHERE content_id = $1
                ORDER BY created_at DESC
                """
                
                media_result = await self.db.execute_query(media_query, content_id)
                content['media_files'] = [dict(row) for row in media_result]
                
                return content
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get content: {e}")
            return None
    
    async def search_content(self, query: str, filters: Dict[str, Any], limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
        """Search content with advanced filtering"""
        try:
            # Build search query
            where_conditions = []
            query_params = []
            param_count = 1
            
            # Text search
            if query:
                where_conditions.append(f"(title ILIKE ${param_count} OR description ILIKE ${param_count} OR content_body ILIKE ${param_count})")
                query_params.append(f"%{query}%")
                param_count += 1
            
            # Filters
            for field, value in filters.items():
                if field == "content_type" and value:
                    where_conditions.append(f"content_type = ${param_count}")
                    query_params.append(value)
                    param_count += 1
                elif field == "status" and value:
                    where_conditions.append(f"status = ${param_count}")
                    query_params.append(value)
                    param_count += 1
                elif field == "category" and value:
                    where_conditions.append(f"category = ${param_count}")
                    query_params.append(value)
                    param_count += 1
                elif field == "difficulty_level" and value:
                    where_conditions.append(f"difficulty_level = ${param_count}")
                    query_params.append(value)
                    param_count += 1
                elif field == "tags" and value:
                    where_conditions.append(f"tags && ${param_count}")
                    query_params.append(value)
                    param_count += 1
            
            # Build final query
            base_query = """
            SELECT c.*, u.email as created_by_email,
                   COUNT(*) OVER() as total_count
            FROM education.content c
            LEFT JOIN education.users u ON c.created_by = u.id
            """
            
            if where_conditions:
                base_query += " WHERE " + " AND ".join(where_conditions)
            
            base_query += f" ORDER BY c.updated_at DESC LIMIT ${param_count} OFFSET ${param_count + 1}"
            query_params.extend([limit, offset])
            
            result = await self.db.execute_query(base_query, *query_params)
            
            return [dict(row) for row in result]
            
        except Exception as e:
            logger.error(f"Failed to search content: {e}")
            raise HTTPException(status_code=500, detail="Failed to search content")
    
    async def upload_media(self, file: UploadFile, media_data: MediaUpload, user_id: str) -> Dict[str, Any]:
        """Upload and process media file"""
        try:
            # Validate file type
            if not self._is_valid_media_file(file):
                raise HTTPException(status_code=400, detail="Invalid file type")
            
            # Save file
            file_path = f"content-media/{media_data.media_type}"
            file_info = await self.storage.save_file(file, file_path)
            
            # Process media based on type
            processed_info = await self._process_media(file, file_info, media_data.media_type)
            
            # Save to database
            media_id = str(uuid.uuid4())
            query = """
            INSERT INTO education.media_files (
                id, content_id, filename, original_filename, file_url, media_type,
                file_size, content_type, file_hash, metadata, alt_text, transcript,
                created_by, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
            """
            
            result = await self.db.execute_query(
                query,
                media_id, media_data.content_id, file_info['filename'],
                file_info['original_filename'], file_info['file_url'],
                media_data.media_type, file_info['file_size'],
                file_info['content_type'], file_info['file_hash'],
                json.dumps(processed_info), media_data.alt_text,
                media_data.transcript, user_id, datetime.utcnow()
            )
            
            if result:
                media_file = dict(result[0])
                logger.info(f"Media uploaded: {media_id}")
                return media_file
            else:
                raise HTTPException(status_code=500, detail="Failed to save media info")
                
        except Exception as e:
            logger.error(f"Failed to upload media: {e}")
            raise HTTPException(status_code=500, detail="Failed to upload media")
    
    async def _generate_embeddings(self, text: str) -> List[float]:
        """Generate text embeddings for search"""
        if not self.embeddings:
            return []
        
        try:
            # Split text into chunks
            chunks = self.text_splitter.split_text(text)
            
            # Generate embeddings for first chunk (for now)
            if chunks:
                embeddings = await self.embeddings.aembed_documents([chunks[0]])
                return embeddings[0] if embeddings else []
            
            return []
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            return []
    
    async def _create_version(self, content_id: str, content: Dict[str, Any], user_id: str, change_summary: str):
        """Create content version"""
        try:
            version_id = str(uuid.uuid4())
            query = """
            INSERT INTO education.content_versions (
                id, content_id, version_number, title, content_body, metadata,
                created_by, created_at, change_summary
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """
            
            await self.db.execute_command(
                query,
                version_id, content_id, content['version'],
                content['title'], content['content_body'],
                json.dumps(content.get('metadata', {})),
                user_id, datetime.utcnow(), change_summary
            )
            
        except Exception as e:
            logger.error(f"Failed to create version: {e}")
    
    async def _index_content(self, content_id: str, content: Dict[str, Any]):
        """Index content for search"""
        try:
            # Store in Redis for fast search
            search_data = {
                "id": content_id,
                "title": content.get('title', ''),
                "description": content.get('description', ''),
                "content_type": content.get('content_type', ''),
                "category": content.get('category', ''),
                "tags": content.get('tags', []),
                "status": content.get('status', ''),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            await self.db.redis.hset(
                f"content_index:{content_id}",
                mapping=search_data
            )
            
            # Add to search sets
            await self.db.redis.sadd("content_search:all", content_id)
            await self.db.redis.sadd(f"content_search:{content.get('content_type', '')}", content_id)
            
        except Exception as e:
            logger.error(f"Failed to index content: {e}")
    
    def _is_valid_media_file(self, file: UploadFile) -> bool:
        """Validate media file"""
        allowed_types = {
            'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            'video': ['video/mp4', 'video/webm', 'video/avi', 'video/mov'],
            'audio': ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
            'document': ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        }
        
        return any(file.content_type in types for types in allowed_types.values())
    
    async def _process_media(self, file: UploadFile, file_info: Dict[str, Any], media_type: str) -> Dict[str, Any]:
        """Process media file based on type"""
        processed_info = {"original_info": file_info}
        
        try:
            if media_type == "image":
                # Process image
                temp_path = f"/tmp/{file_info['filename']}"
                async with aiofiles.open(temp_path, 'wb') as f:
                    await f.write(await file.read())
                
                with Image.open(temp_path) as img:
                    processed_info.update({
                        "width": img.width,
                        "height": img.height,
                        "format": img.format,
                        "mode": img.mode
                    })
                
                # Clean up
                os.remove(temp_path)
                
            elif media_type == "video":
                # Process video (basic info)
                processed_info.update({
                    "processing_status": "queued",
                    "transcoding_required": True
                })
                
            elif media_type == "audio":
                # Process audio
                processed_info.update({
                    "processing_status": "queued",
                    "transcription_required": True
                })
                
            elif media_type == "document":
                # Extract text content
                try:
                    temp_path = f"/tmp/{file_info['filename']}"
                    async with aiofiles.open(temp_path, 'wb') as f:
                        await f.write(await file.read())
                    
                    text_content = textract.process(temp_path).decode('utf-8')
                    processed_info.update({
                        "text_content": text_content[:5000],  # First 5000 chars
                        "word_count": len(text_content.split()),
                        "extractable": True
                    })
                    
                    os.remove(temp_path)
                    
                except Exception as e:
                    logger.warning(f"Failed to extract text from document: {e}")
                    processed_info.update({
                        "extractable": False,
                        "extraction_error": str(e)
                    })
            
            return processed_info
            
        except Exception as e:
            logger.error(f"Failed to process media: {e}")
            return processed_info

# Global content management engine
content_engine = None

# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global content_engine
    await db_manager.connect()
    content_engine = ContentManagementEngine(db_manager, storage_manager)
    logger.info("Content management service started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await db_manager.disconnect()
    logger.info("Content management service shutdown complete")

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
            "service": "content-management",
            "version": "1.0.0",
            "database": "connected",
            "redis": "connected",
            "storage": "configured"
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

# Content CRUD endpoints
@app.post("/content")
async def create_content(content: ContentCreate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Create new content"""
    user_id = "user123"  # Extract from JWT token
    return await content_engine.create_content(content, user_id)

@app.get("/content/{content_id}")
async def get_content(content_id: str):
    """Get content by ID"""
    content = await content_engine.get_content_by_id(content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    return content

@app.put("/content/{content_id}")
async def update_content(content_id: str, content: ContentUpdate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Update content"""
    user_id = "user123"  # Extract from JWT token
    return await content_engine.update_content(content_id, content, user_id)

@app.get("/content")
async def search_content(
    q: str = Query(None, description="Search query"),
    content_type: str = Query(None, description="Filter by content type"),
    status: str = Query(None, description="Filter by status"),
    category: str = Query(None, description="Filter by category"),
    difficulty_level: str = Query(None, description="Filter by difficulty"),
    tags: str = Query(None, description="Filter by tags (comma-separated)"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Search content with filters"""
    filters = {}
    if content_type:
        filters["content_type"] = content_type
    if status:
        filters["status"] = status
    if category:
        filters["category"] = category
    if difficulty_level:
        filters["difficulty_level"] = difficulty_level
    if tags:
        filters["tags"] = tags.split(",")
    
    return await content_engine.search_content(q or "", filters, limit, offset)

@app.post("/media/upload")
async def upload_media(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(None),
    media_type: str = Form(...),
    content_id: str = Form(None),
    tags: str = Form(""),
    alt_text: str = Form(None),
    transcript: str = Form(None),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Upload media file"""
    user_id = "user123"  # Extract from JWT token
    
    media_data = MediaUpload(
        title=title,
        description=description,
        media_type=media_type,
        content_id=content_id,
        tags=tags.split(",") if tags else [],
        alt_text=alt_text,
        transcript=transcript
    )
    
    return await content_engine.upload_media(file, media_data, user_id)

@app.get("/files/{file_path:path}")
async def serve_file(file_path: str):
    """Serve uploaded files"""
    if not storage_manager.use_s3:
        full_path = storage_manager.local_storage_path / file_path
        if full_path.exists():
            return FileResponse(full_path)
    
    raise HTTPException(status_code=404, detail="File not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8006)),
        reload=os.getenv("ENVIRONMENT") == "development"
    )