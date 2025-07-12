"""
Content Management Service - Simplified for MVP Validation
EbroValley Digital - Adaptive Learning Ecosystem
"""

import os
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app initialization
app = FastAPI(
    title="Content Management Service",
    description="Simplified Content Management for Adaptive Learning Platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class ContentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., max_length=1000)
    type: str = Field(..., pattern="^(course|lesson|module|quiz|video|document)$")
    content: Optional[Dict[str, Any]] = None
    author_id: Optional[str] = None
    parent_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = []
    status: str = Field(default="draft", pattern="^(draft|published|archived)$")
    category: Optional[str] = None
    language: str = Field(default="es")
    difficulty_level: Optional[int] = Field(default=1, ge=1, le=5)
    estimated_duration: Optional[int] = None  # in minutes

class ContentCreate(ContentBase):
    pass

class ContentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None
    difficulty_level: Optional[int] = None
    estimated_duration: Optional[int] = None

class ContentResponse(ContentBase):
    id: str
    created_at: datetime
    updated_at: datetime
    version: int = 1

class CourseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., max_length=1000)
    category: Optional[str] = None
    difficulty_level: int = Field(default=1, ge=1, le=5)
    estimated_duration: Optional[int] = None
    price: Optional[float] = Field(default=0.0, ge=0)
    language: str = Field(default="es")
    tags: Optional[List[str]] = []
    objectives: Optional[List[str]] = []

class LessonCreate(BaseModel):
    course_id: str
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., max_length=1000)
    content: Dict[str, Any] = {}
    order_index: int = Field(default=0, ge=0)
    estimated_duration: Optional[int] = None

# In-memory storage for MVP validation
content_storage: Dict[str, Dict[str, Any]] = {}
course_storage: Dict[str, Dict[str, Any]] = {}
lesson_storage: Dict[str, Dict[str, Any]] = {}

def generate_id() -> str:
    """Generate simple UUID for content"""
    import uuid
    return str(uuid.uuid4())

# Health Check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Content Endpoints
@app.post("/content", response_model=ContentResponse)
async def create_content(content: ContentCreate):
    """Create new content"""
    try:
        content_id = generate_id()
        now = datetime.now()
        
        content_data = {
            "id": content_id,
            **content.dict(),
            "created_at": now,
            "updated_at": now,
            "version": 1
        }
        
        content_storage[content_id] = content_data
        
        logger.info(f"Created content: {content_id} - {content.title}")
        return ContentResponse(**content_data)
        
    except Exception as e:
        logger.error(f"Error creating content: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create content")

@app.get("/content/{content_id}", response_model=ContentResponse)
async def get_content(content_id: str):
    """Get content by ID"""
    if content_id not in content_storage:
        raise HTTPException(status_code=404, detail="Content not found")
    
    return ContentResponse(**content_storage[content_id])

@app.put("/content/{content_id}", response_model=ContentResponse)
async def update_content(content_id: str, content_update: ContentUpdate):
    """Update existing content"""
    if content_id not in content_storage:
        raise HTTPException(status_code=404, detail="Content not found")
    
    current_content = content_storage[content_id]
    update_data = content_update.dict(exclude_unset=True)
    
    # Update fields
    for field, value in update_data.items():
        if value is not None:
            current_content[field] = value
    
    current_content["updated_at"] = datetime.now()
    current_content["version"] += 1
    
    logger.info(f"Updated content: {content_id}")
    return ContentResponse(**current_content)

@app.delete("/content/{content_id}")
async def delete_content(content_id: str):
    """Delete content"""
    if content_id not in content_storage:
        raise HTTPException(status_code=404, detail="Content not found")
    
    del content_storage[content_id]
    logger.info(f"Deleted content: {content_id}")
    return {"message": "Content deleted successfully"}

@app.get("/content")
async def search_content(
    q: Optional[str] = Query(None, description="Search query"),
    type: Optional[str] = Query(None, description="Content type filter"),
    status: Optional[str] = Query(None, description="Status filter"),
    category: Optional[str] = Query(None, description="Category filter"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page")
):
    """Search and filter content"""
    results = list(content_storage.values())
    
    # Apply filters
    if q:
        results = [c for c in results if q.lower() in c.get('title', '').lower() or q.lower() in c.get('description', '').lower()]
    
    if type:
        results = [c for c in results if c.get('type') == type]
    
    if status:
        results = [c for c in results if c.get('status') == status]
    
    if category:
        results = [c for c in results if c.get('category') == category]
    
    # Pagination
    start = (page - 1) * limit
    end = start + limit
    paginated_results = results[start:end]
    
    return {
        "items": paginated_results,
        "total": len(results),
        "page": page,
        "limit": limit,
        "pages": (len(results) + limit - 1) // limit
    }

# Course Endpoints
@app.post("/courses")
async def create_course(course: CourseCreate):
    """Create new course"""
    try:
        course_id = generate_id()
        now = datetime.now()
        
        course_data = {
            "id": course_id,
            **course.dict(),
            "created_at": now,
            "updated_at": now,
            "status": "draft",
            "lessons_count": 0
        }
        
        course_storage[course_id] = course_data
        
        logger.info(f"Created course: {course_id} - {course.title}")
        return course_data
        
    except Exception as e:
        logger.error(f"Error creating course: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create course")

@app.get("/courses")
async def get_courses(
    category: Optional[str] = Query(None),
    difficulty: Optional[int] = Query(None),
    language: str = Query("es"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    """Get courses with filters"""
    results = list(course_storage.values())
    
    # Apply filters
    if category:
        results = [c for c in results if c.get('category') == category]
    
    if difficulty:
        results = [c for c in results if c.get('difficulty_level') == difficulty]
    
    if language:
        results = [c for c in results if c.get('language') == language]
    
    # Pagination
    start = (page - 1) * limit
    end = start + limit
    paginated_results = results[start:end]
    
    return {
        "items": paginated_results,
        "total": len(results),
        "page": page,
        "limit": limit
    }

@app.put("/courses/{course_id}")
async def update_course(course_id: str, course_update: Dict[str, Any]):
    """Update course"""
    if course_id not in course_storage:
        raise HTTPException(status_code=404, detail="Course not found")
    
    current_course = course_storage[course_id]
    
    # Update fields
    for field, value in course_update.items():
        if value is not None:
            current_course[field] = value
    
    current_course["updated_at"] = datetime.now()
    
    logger.info(f"Updated course: {course_id}")
    return current_course

@app.delete("/courses/{course_id}")
async def delete_course(course_id: str):
    """Delete course"""
    if course_id not in course_storage:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Also delete associated lessons
    lessons_to_delete = [lid for lid, lesson in lesson_storage.items() if lesson.get('course_id') == course_id]
    for lesson_id in lessons_to_delete:
        del lesson_storage[lesson_id]
    
    del course_storage[course_id]
    logger.info(f"Deleted course and associated lessons: {course_id}")
    return {"message": "Course deleted successfully"}

# Lesson Endpoints
@app.post("/lessons")
async def create_lesson(lesson: LessonCreate):
    """Create new lesson"""
    try:
        # Verify course exists
        if lesson.course_id not in course_storage:
            raise HTTPException(status_code=404, detail="Course not found")
        
        lesson_id = generate_id()
        now = datetime.now()
        
        lesson_data = {
            "id": lesson_id,
            **lesson.dict(),
            "created_at": now,
            "updated_at": now,
            "status": "draft"
        }
        
        lesson_storage[lesson_id] = lesson_data
        
        # Update course lesson count
        course_storage[lesson.course_id]["lessons_count"] += 1
        
        logger.info(f"Created lesson: {lesson_id} - {lesson.title}")
        return lesson_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating lesson: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create lesson")

@app.get("/lessons")
async def get_lessons(course_id: Optional[str] = Query(None)):
    """Get lessons, optionally filtered by course"""
    results = list(lesson_storage.values())
    
    if course_id:
        results = [l for l in results if l.get('course_id') == course_id]
    
    # Sort by order_index
    results.sort(key=lambda x: x.get('order_index', 0))
    
    return {"items": results, "total": len(results)}

# Media Upload (simplified)
@app.post("/media/upload")
async def upload_media(file: UploadFile = File(...)):
    """Upload media file (simplified for MVP)"""
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        
        # Generate unique filename
        file_id = generate_id()
        file_extension = Path(file.filename).suffix if file.filename else ""
        filename = f"{file_id}{file_extension}"
        file_path = upload_dir / filename
        
        # Save file
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Return file info
        file_info = {
            "id": file_id,
            "filename": file.filename,
            "stored_filename": filename,
            "size": len(content),
            "content_type": file.content_type,
            "url": f"/files/{filename}",
            "uploaded_at": datetime.now().isoformat()
        }
        
        logger.info(f"Uploaded file: {filename} ({len(content)} bytes)")
        return file_info
        
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload file")

# File serving (simplified)
@app.get("/files/{filename}")
async def get_file(filename: str):
    """Serve uploaded files"""
    file_path = Path("uploads") / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path)

# Templates (simplified)
@app.get("/templates")
async def get_templates(type: Optional[str] = Query(None)):
    """Get content templates"""
    templates = {
        "course": [
            {
                "id": "basic_course",
                "name": "Curso Básico",
                "description": "Plantilla básica para cursos",
                "structure": {
                    "modules": [],
                    "assessments": [],
                    "resources": []
                }
            }
        ],
        "lesson": [
            {
                "id": "video_lesson",
                "name": "Lección con Video",
                "description": "Lección centrada en contenido de video",
                "structure": {
                    "intro": "",
                    "video_url": "",
                    "transcript": "",
                    "exercises": []
                }
            }
        ]
    }
    
    if type and type in templates:
        return {"items": templates[type]}
    
    return {"items": templates}

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8006))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Starting Content Management Service on {host}:{port}")
    
    uvicorn.run(
        "main_simple:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )