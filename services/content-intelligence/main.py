"""
Content Intelligence Service - Adaptive Learning Ecosystem
EbroValley Digital - AI-powered content analysis and generation

Advanced content intelligence service providing:
- Content analysis and quality assessment
- Automated question generation
- Content difficulty level detection
- Learning objective extraction
- Content improvement suggestions
- Plagiarism detection
- Readability analysis
- Content translation and localization
"""

import asyncio
import json
import logging
import os
import re
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from enum import Enum

import asyncpg
import redis.asyncio as redis
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
import openai
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.llms import OpenAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
import tiktoken
import nltk
from textstat import flesch_reading_ease, flesch_kincaid_grade

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

# FastAPI app initialization
app = FastAPI(
    title="Content Intelligence Service",
    description="AI-powered content analysis and generation system",
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
    """Content types for analysis"""
    TEXT = "text"
    DOCUMENT = "document"
    VIDEO = "video"
    AUDIO = "audio"
    PRESENTATION = "presentation"
    INTERACTIVE = "interactive"

class DifficultyLevel(str, Enum):
    """Content difficulty levels"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class QuestionType(str, Enum):
    """Question types for generation"""
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"
    ESSAY = "essay"
    FILL_BLANK = "fill_blank"

class ContentAnalysisRequest(BaseModel):
    """Content analysis request model"""
    content: str = Field(..., min_length=10, max_length=50000)
    content_type: ContentType = Field(default=ContentType.TEXT)
    analyze_difficulty: bool = Field(default=True)
    analyze_readability: bool = Field(default=True)
    extract_objectives: bool = Field(default=True)
    check_plagiarism: bool = Field(default=False)
    target_audience: Optional[str] = Field(None, description="Target audience description")
    subject_area: Optional[str] = Field(None, description="Subject area or domain")

class QuestionGenerationRequest(BaseModel):
    """Question generation request model"""
    content: str = Field(..., min_length=10, max_length=10000)
    question_types: List[QuestionType] = Field(default=[QuestionType.MULTIPLE_CHOICE])
    num_questions: int = Field(default=5, ge=1, le=20)
    difficulty_level: Optional[DifficultyLevel] = Field(None)
    focus_topics: List[str] = Field(default_factory=list)
    bloom_taxonomy_level: Optional[str] = Field(None, description="remember, understand, apply, analyze, evaluate, create")

class ContentImprovementRequest(BaseModel):
    """Content improvement request model"""
    content: str = Field(..., min_length=10, max_length=20000)
    current_difficulty: Optional[DifficultyLevel] = None
    target_difficulty: Optional[DifficultyLevel] = None
    target_audience: Optional[str] = None
    improvement_areas: List[str] = Field(default_factory=list, description="clarity, engagement, structure, examples")
    preserve_length: bool = Field(default=False)

class TranslationRequest(BaseModel):
    """Content translation request model"""
    content: str = Field(..., min_length=1, max_length=10000)
    source_language: str = Field(default="auto")
    target_language: str = Field(..., min_length=2, max_length=10)
    preserve_formatting: bool = Field(default=True)
    context: Optional[str] = Field(None, description="Educational context for better translation")

class ContentAnalysisResult(BaseModel):
    """Content analysis result model"""
    content_id: str
    difficulty_level: Optional[DifficultyLevel] = None
    readability_score: Optional[float] = None
    grade_level: Optional[float] = None
    word_count: int
    sentence_count: int
    paragraph_count: int
    learning_objectives: List[str] = Field(default_factory=list)
    key_topics: List[str] = Field(default_factory=list)
    complexity_metrics: Dict[str, float] = Field(default_factory=dict)
    improvement_suggestions: List[str] = Field(default_factory=list)
    plagiarism_score: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class GeneratedQuestion(BaseModel):
    """Generated question model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question_type: QuestionType
    question: str
    options: List[str] = Field(default_factory=list)
    correct_answer: Union[str, List[str]]
    explanation: Optional[str] = None
    difficulty_level: Optional[DifficultyLevel] = None
    bloom_level: Optional[str] = None
    topic: Optional[str] = None

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
# CONTENT INTELLIGENCE ENGINE
# =============================================================================

class ContentIntelligenceEngine:
    """Core content intelligence engine"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        
        if self.openai_api_key:
            openai.api_key = self.openai_api_key
            self.llm = OpenAI(temperature=0.7)
            self.embeddings = OpenAIEmbeddings()
        else:
            logger.warning("OpenAI API key not configured - AI features disabled")
            self.llm = None
            self.embeddings = None
        
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
    
    async def analyze_content(self, request: ContentAnalysisRequest) -> ContentAnalysisResult:
        """Analyze content comprehensively"""
        try:
            content_id = str(uuid.uuid4())
            
            # Basic text metrics
            word_count = len(request.content.split())
            sentence_count = len(nltk.sent_tokenize(request.content))
            paragraph_count = len([p for p in request.content.split('\n\n') if p.strip()])
            
            result = ContentAnalysisResult(
                content_id=content_id,
                word_count=word_count,
                sentence_count=sentence_count,
                paragraph_count=paragraph_count
            )
            
            # Readability analysis
            if request.analyze_readability:
                try:
                    readability_score = flesch_reading_ease(request.content)
                    grade_level = flesch_kincaid_grade(request.content)
                    result.readability_score = readability_score
                    result.grade_level = grade_level
                except:
                    logger.warning("Readability analysis failed")
            
            # Difficulty level detection
            if request.analyze_difficulty:
                difficulty = await self._detect_difficulty_level(request.content)
                result.difficulty_level = difficulty
            
            # Learning objectives extraction
            if request.extract_objectives and self.llm:
                objectives = await self._extract_learning_objectives(request.content)
                result.learning_objectives = objectives
            
            # Key topics extraction
            if self.llm:
                topics = await self._extract_key_topics(request.content)
                result.key_topics = topics
            
            # Complexity metrics
            result.complexity_metrics = self._calculate_complexity_metrics(request.content)
            
            # Improvement suggestions
            if self.llm:
                suggestions = await self._generate_improvement_suggestions(request.content)
                result.improvement_suggestions = suggestions
            
            # Store analysis result
            await self._store_analysis_result(result)
            
            return result
            
        except Exception as e:
            logger.error(f"Content analysis failed: {e}")
            raise HTTPException(status_code=500, detail="Content analysis failed")
    
    async def generate_questions(self, request: QuestionGenerationRequest) -> List[GeneratedQuestion]:
        """Generate questions from content"""
        if not self.llm:
            raise HTTPException(status_code=503, detail="AI service not available")
        
        try:
            questions = []
            
            for question_type in request.question_types:
                questions_for_type = await self._generate_questions_by_type(
                    request.content,
                    question_type,
                    request.num_questions // len(request.question_types),
                    request.difficulty_level,
                    request.bloom_taxonomy_level
                )
                questions.extend(questions_for_type)
            
            # Store generated questions
            for question in questions:
                await self._store_generated_question(question)
            
            return questions
            
        except Exception as e:
            logger.error(f"Question generation failed: {e}")
            raise HTTPException(status_code=500, detail="Question generation failed")
    
    async def improve_content(self, request: ContentImprovementRequest) -> Dict[str, Any]:
        """Generate content improvement suggestions"""
        if not self.llm:
            raise HTTPException(status_code=503, detail="AI service not available")
        
        try:
            # Analyze current content
            current_analysis = await self.analyze_content(
                ContentAnalysisRequest(content=request.content)
            )
            
            # Generate improvements
            improvements = {}
            
            if "clarity" in request.improvement_areas:
                improvements["clarity"] = await self._improve_clarity(request.content)
            
            if "engagement" in request.improvement_areas:
                improvements["engagement"] = await self._improve_engagement(request.content)
            
            if "structure" in request.improvement_areas:
                improvements["structure"] = await self._improve_structure(request.content)
            
            if "examples" in request.improvement_areas:
                improvements["examples"] = await self._add_examples(request.content)
            
            # Adjust difficulty if requested
            if request.target_difficulty and request.target_difficulty != request.current_difficulty:
                improvements["difficulty_adjustment"] = await self._adjust_difficulty(
                    request.content,
                    request.current_difficulty,
                    request.target_difficulty
                )
            
            return {
                "original_analysis": current_analysis.dict(),
                "improvements": improvements,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Content improvement failed: {e}")
            raise HTTPException(status_code=500, detail="Content improvement failed")
    
    async def translate_content(self, request: TranslationRequest) -> Dict[str, Any]:
        """Translate content to target language"""
        if not self.llm:
            raise HTTPException(status_code=503, detail="AI service not available")
        
        try:
            # Create translation prompt
            prompt = PromptTemplate(
                input_variables=["content", "source_lang", "target_lang", "context"],
                template="""
                Translate the following educational content from {source_lang} to {target_lang}.
                
                Context: {context}
                
                Content to translate:
                {content}
                
                Requirements:
                - Preserve educational terminology
                - Maintain the same difficulty level
                - Keep formatting if possible
                - Ensure cultural appropriateness
                
                Translation:
                """
            )
            
            chain = LLMChain(llm=self.llm, prompt=prompt)
            
            translated_content = await chain.arun(
                content=request.content,
                source_lang=request.source_language,
                target_lang=request.target_language,
                context=request.context or "Educational content"
            )
            
            # Analyze translated content
            translated_analysis = await self.analyze_content(
                ContentAnalysisRequest(content=translated_content)
            )
            
            return {
                "original_content": request.content,
                "translated_content": translated_content,
                "source_language": request.source_language,
                "target_language": request.target_language,
                "analysis": translated_analysis.dict(),
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Translation failed: {e}")
            raise HTTPException(status_code=500, detail="Translation failed")
    
    async def _detect_difficulty_level(self, content: str) -> DifficultyLevel:
        """Detect content difficulty level"""
        if not self.llm:
            # Fallback to simple heuristics
            avg_word_length = sum(len(word) for word in content.split()) / len(content.split())
            avg_sentence_length = len(content.split()) / len(nltk.sent_tokenize(content))
            
            if avg_word_length < 4.5 and avg_sentence_length < 15:
                return DifficultyLevel.BEGINNER
            elif avg_word_length < 6 and avg_sentence_length < 20:
                return DifficultyLevel.INTERMEDIATE
            else:
                return DifficultyLevel.ADVANCED
        
        try:
            prompt = PromptTemplate(
                input_variables=["content"],
                template="""
                Analyze the following educational content and determine its difficulty level.
                Consider vocabulary complexity, sentence structure, concept difficulty, and required background knowledge.
                
                Content:
                {content}
                
                Classify as: beginner, intermediate, advanced, or expert
                
                Difficulty level:
                """
            )
            
            chain = LLMChain(llm=self.llm, prompt=prompt)
            result = await chain.arun(content=content[:2000])  # Limit content for analysis
            
            result_lower = result.lower().strip()
            if "beginner" in result_lower:
                return DifficultyLevel.BEGINNER
            elif "intermediate" in result_lower:
                return DifficultyLevel.INTERMEDIATE
            elif "expert" in result_lower:
                return DifficultyLevel.EXPERT
            else:
                return DifficultyLevel.ADVANCED
                
        except Exception as e:
            logger.error(f"Difficulty detection failed: {e}")
            return DifficultyLevel.INTERMEDIATE
    
    async def _extract_learning_objectives(self, content: str) -> List[str]:
        """Extract learning objectives from content"""
        try:
            prompt = PromptTemplate(
                input_variables=["content"],
                template="""
                Analyze the following educational content and extract the main learning objectives.
                Learning objectives should be specific, measurable, and achievable.
                
                Content:
                {content}
                
                Extract 3-5 learning objectives in the format:
                - Students will be able to...
                - Learners will understand...
                - Participants will demonstrate...
                
                Learning objectives:
                """
            )
            
            chain = LLMChain(llm=self.llm, prompt=prompt)
            result = await chain.arun(content=content[:3000])
            
            # Parse objectives from result
            objectives = []
            for line in result.split('\n'):
                line = line.strip()
                if line.startswith('-') or line.startswith('•'):
                    objectives.append(line[1:].strip())
            
            return objectives[:5]  # Limit to 5 objectives
            
        except Exception as e:
            logger.error(f"Learning objectives extraction failed: {e}")
            return []
    
    async def _extract_key_topics(self, content: str) -> List[str]:
        """Extract key topics from content"""
        try:
            prompt = PromptTemplate(
                input_variables=["content"],
                template="""
                Analyze the following educational content and identify the main topics and concepts covered.
                
                Content:
                {content}
                
                List the 5-10 most important topics as single words or short phrases:
                """
            )
            
            chain = LLMChain(llm=self.llm, prompt=prompt)
            result = await chain.arun(content=content[:3000])
            
            # Parse topics from result
            topics = []
            for line in result.split('\n'):
                line = line.strip()
                if line and not line.startswith(('Analyze', 'Content', 'List')):
                    # Remove bullets and numbering
                    clean_line = re.sub(r'^[\d\.\-\•\*]\s*', '', line)
                    if clean_line:
                        topics.append(clean_line)
            
            return topics[:10]  # Limit to 10 topics
            
        except Exception as e:
            logger.error(f"Key topics extraction failed: {e}")
            return []
    
    def _calculate_complexity_metrics(self, content: str) -> Dict[str, float]:
        """Calculate various complexity metrics"""
        try:
            words = content.split()
            sentences = nltk.sent_tokenize(content)
            
            # Lexical diversity
            unique_words = len(set(word.lower() for word in words))
            lexical_diversity = unique_words / len(words) if words else 0
            
            # Average word length
            avg_word_length = sum(len(word) for word in words) / len(words) if words else 0
            
            # Average sentence length
            avg_sentence_length = len(words) / len(sentences) if sentences else 0
            
            # Syllable complexity (approximation)
            syllable_count = sum(max(1, len(re.findall(r'[aeiouy]+', word.lower()))) for word in words)
            avg_syllables = syllable_count / len(words) if words else 0
            
            return {
                "lexical_diversity": round(lexical_diversity, 3),
                "avg_word_length": round(avg_word_length, 2),
                "avg_sentence_length": round(avg_sentence_length, 2),
                "avg_syllables_per_word": round(avg_syllables, 2),
                "total_words": len(words),
                "total_sentences": len(sentences)
            }
            
        except Exception as e:
            logger.error(f"Complexity metrics calculation failed: {e}")
            return {}
    
    async def _generate_improvement_suggestions(self, content: str) -> List[str]:
        """Generate content improvement suggestions"""
        try:
            prompt = PromptTemplate(
                input_variables=["content"],
                template="""
                Analyze the following educational content and provide specific suggestions for improvement.
                Consider clarity, engagement, structure, examples, and pedagogical effectiveness.
                
                Content:
                {content}
                
                Provide 3-5 specific improvement suggestions:
                """
            )
            
            chain = LLMChain(llm=self.llm, prompt=prompt)
            result = await chain.arun(content=content[:3000])
            
            # Parse suggestions from result
            suggestions = []
            for line in result.split('\n'):
                line = line.strip()
                if line.startswith(('-', '•', '*')) or line[0].isdigit():
                    clean_line = re.sub(r'^[\d\.\-\•\*]\s*', '', line)
                    if clean_line:
                        suggestions.append(clean_line)
            
            return suggestions[:5]  # Limit to 5 suggestions
            
        except Exception as e:
            logger.error(f"Improvement suggestions generation failed: {e}")
            return []
    
    async def _generate_questions_by_type(self, content: str, question_type: QuestionType, 
                                        num_questions: int, difficulty: Optional[DifficultyLevel],
                                        bloom_level: Optional[str]) -> List[GeneratedQuestion]:
        """Generate questions of specific type"""
        try:
            questions = []
            
            if question_type == QuestionType.MULTIPLE_CHOICE:
                prompt = PromptTemplate(
                    input_variables=["content", "num_questions", "difficulty", "bloom_level"],
                    template="""
                    Create {num_questions} multiple choice questions based on the following content.
                    Difficulty level: {difficulty}
                    Bloom's taxonomy level: {bloom_level}
                    
                    Content:
                    {content}
                    
                    For each question, provide:
                    - Question text
                    - 4 options (A, B, C, D)
                    - Correct answer
                    - Brief explanation
                    
                    Format each question as:
                    Q: [Question text]
                    A) [Option A]
                    B) [Option B]
                    C) [Option C]
                    D) [Option D]
                    Correct: [Letter]
                    Explanation: [Brief explanation]
                    ---
                    """
                )
                
                chain = LLMChain(llm=self.llm, prompt=prompt)
                result = await chain.arun(
                    content=content[:4000],
                    num_questions=num_questions,
                    difficulty=difficulty.value if difficulty else "intermediate",
                    bloom_level=bloom_level or "understand"
                )
                
                # Parse questions from result
                question_blocks = result.split('---')
                for block in question_blocks:
                    if 'Q:' in block:
                        question = self._parse_multiple_choice_question(block)
                        if question:
                            questions.append(question)
            
            # Add other question types...
            
            return questions
            
        except Exception as e:
            logger.error(f"Question generation failed: {e}")
            return []
    
    def _parse_multiple_choice_question(self, block: str) -> Optional[GeneratedQuestion]:
        """Parse multiple choice question from text block"""
        try:
            lines = [line.strip() for line in block.split('\n') if line.strip()]
            
            question_text = ""
            options = []
            correct_answer = ""
            explanation = ""
            
            for line in lines:
                if line.startswith('Q:'):
                    question_text = line[2:].strip()
                elif line.startswith(('A)', 'B)', 'C)', 'D)')):
                    options.append(line[2:].strip())
                elif line.startswith('Correct:'):
                    correct_answer = line[8:].strip()
                elif line.startswith('Explanation:'):
                    explanation = line[12:].strip()
            
            if question_text and options and correct_answer:
                return GeneratedQuestion(
                    question_type=QuestionType.MULTIPLE_CHOICE,
                    question=question_text,
                    options=options,
                    correct_answer=correct_answer,
                    explanation=explanation
                )
            
        except Exception as e:
            logger.error(f"Question parsing failed: {e}")
        
        return None
    
    async def _store_analysis_result(self, result: ContentAnalysisResult):
        """Store analysis result in database"""
        try:
            query = """
            INSERT INTO education.content_analysis (
                id, difficulty_level, readability_score, grade_level, word_count,
                sentence_count, paragraph_count, learning_objectives, key_topics,
                complexity_metrics, improvement_suggestions, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            """
            
            await self.db.execute_command(
                query,
                result.content_id,
                result.difficulty_level.value if result.difficulty_level else None,
                result.readability_score,
                result.grade_level,
                result.word_count,
                result.sentence_count,
                result.paragraph_count,
                result.learning_objectives,
                result.key_topics,
                json.dumps(result.complexity_metrics),
                result.improvement_suggestions,
                result.timestamp
            )
            
        except Exception as e:
            logger.error(f"Failed to store analysis result: {e}")
    
    async def _store_generated_question(self, question: GeneratedQuestion):
        """Store generated question in database"""
        try:
            query = """
            INSERT INTO education.generated_questions (
                id, question_type, question, options, correct_answer,
                explanation, difficulty_level, bloom_level, topic, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            """
            
            await self.db.execute_command(
                query,
                question.id,
                question.question_type.value,
                question.question,
                question.options,
                question.correct_answer,
                question.explanation,
                question.difficulty_level.value if question.difficulty_level else None,
                question.bloom_level,
                question.topic,
                datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Failed to store generated question: {e}")
    
    # Placeholder methods for improvement features
    async def _improve_clarity(self, content: str) -> str:
        """Improve content clarity"""
        # Implementation for clarity improvement
        return content
    
    async def _improve_engagement(self, content: str) -> str:
        """Improve content engagement"""
        # Implementation for engagement improvement
        return content
    
    async def _improve_structure(self, content: str) -> str:
        """Improve content structure"""
        # Implementation for structure improvement
        return content
    
    async def _add_examples(self, content: str) -> str:
        """Add examples to content"""
        # Implementation for adding examples
        return content
    
    async def _adjust_difficulty(self, content: str, current: DifficultyLevel, target: DifficultyLevel) -> str:
        """Adjust content difficulty"""
        # Implementation for difficulty adjustment
        return content

# Global content intelligence service
content_intelligence = None

# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global content_intelligence
    await db_manager.connect()
    content_intelligence = ContentIntelligenceEngine(db_manager)
    logger.info("Content intelligence service started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await db_manager.disconnect()
    logger.info("Content intelligence service shutdown complete")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        await db_manager.execute_query("SELECT 1")
        
        # Test Redis connection
        await db_manager.redis.ping()
        
        # Test OpenAI API
        openai_status = "configured" if content_intelligence.openai_api_key else "not_configured"
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "content-intelligence",
            "version": "1.0.0",
            "database": "connected",
            "redis": "connected",
            "openai": openai_status
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

@app.post("/analyze")
async def analyze_content(
    request: ContentAnalysisRequest,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Analyze content comprehensively"""
    return await content_intelligence.analyze_content(request)

@app.post("/generate-questions")
async def generate_questions(
    request: QuestionGenerationRequest,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Generate questions from content"""
    return await content_intelligence.generate_questions(request)

@app.post("/improve")
async def improve_content(
    request: ContentImprovementRequest,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Generate content improvement suggestions"""
    return await content_intelligence.improve_content(request)

@app.post("/translate")
async def translate_content(
    request: TranslationRequest,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Translate content to target language"""
    return await content_intelligence.translate_content(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8009)),
        reload=os.getenv("ENVIRONMENT") == "development"
    )