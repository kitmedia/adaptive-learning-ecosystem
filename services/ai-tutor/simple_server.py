#!/usr/bin/env python3
"""
AI-Tutor Simple HTTP Server - Sin dependencias externas
Adaptive Learning Ecosystem - EbroValley Digital
"""

import http.server
import socketserver
import json
import sqlite3
import os
import urllib.parse
from datetime import datetime
import uuid
import sys

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.diagnostic_service import DiagnosticService
from app.services.adaptive_path_service import AdaptivePathService
from app.services.dynamic_pace_service import DynamicPaceService
from app.services.realtime_feedback_service import RealtimeFeedbackService
from app.services.teaching_style_adaptation_service import TeachingStyleAdaptationService
from app.services.continuous_evaluation_service import ContinuousEvaluationService
from app.services.intelligent_tutoring_service import IntelligentTutoringService

class AITutorHandler(http.server.BaseHTTPRequestHandler):
    
    def __init__(self, *args, **kwargs):
        # Initialize AI services
        self.diagnostic_service = DiagnosticService()
        self.adaptive_path_service = AdaptivePathService()
        self.dynamic_pace_service = DynamicPaceService()
        self.feedback_service = RealtimeFeedbackService()
        self.adaptation_service = TeachingStyleAdaptationService()
        self.evaluation_service = ContinuousEvaluationService()
        self.tutoring_service = IntelligentTutoringService()
        super().__init__(*args, **kwargs)
    
    def get_db_connection(self):
        """Get database connection"""
        db_path = os.path.join(os.path.dirname(__file__), '../../database/adaptive_learning.db')
        return sqlite3.connect(db_path)
    
    def send_json_response(self, data, status=200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode())
    
    def send_error_response(self, message, status=500):
        """Send error response"""
        self.send_json_response({"error": message, "timestamp": datetime.now().isoformat()}, status)
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        try:
            if self.path == '/health':
                self.handle_health_check()
            elif self.path.startswith('/students/') and self.path.endswith('/profile'):
                # Extract student_id from path like /students/123/profile
                student_id = self.path.split('/')[2]
                self.handle_get_student_profile(student_id)
            else:
                self.send_error_response("Endpoint not found", 404)
        except Exception as e:
            self.send_error_response(f"Server error: {str(e)}")
    
    def do_POST(self):
        """Handle POST requests"""
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            
            try:
                data = json.loads(post_data) if post_data else {}
            except json.JSONDecodeError:
                self.send_error_response("Invalid JSON in request body", 400)
                return
            
            if self.path == '/diagnostic/generate':
                self.handle_diagnostic_generate(data)
            elif self.path == '/diagnostic/analyze':
                self.handle_diagnostic_analyze(data)
            elif self.path.startswith('/path/adaptive/'):
                student_id = self.path.split('/')[-1]
                self.handle_adaptive_path(student_id, data)
            elif self.path == '/feedback/realtime':
                self.handle_realtime_feedback(data)
            elif self.path == '/evaluation/continuous':
                self.handle_continuous_evaluation(data)
            elif self.path == '/chat/process':
                self.handle_chat_process(data)
            else:
                self.send_error_response("Endpoint not found", 404)
                
        except Exception as e:
            self.send_error_response(f"Server error: {str(e)}")
    
    def handle_health_check(self):
        """Health check endpoint"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]
            conn.close()
            
            response = {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "database": "connected",
                "user_count": user_count,
                "services": {
                    "diagnostic": "ready",
                    "adaptive_path": "ready", 
                    "dynamic_pace": "ready",
                    "feedback": "ready",
                    "adaptation": "ready",
                    "evaluation": "ready",
                    "tutoring": "ready"
                }
            }
            self.send_json_response(response)
        except Exception as e:
            self.send_error_response(f"Health check failed: {str(e)}", 503)
    
    def handle_diagnostic_generate(self, data):
        """Generate diagnostic assessment"""
        student_id = data.get("student_id")
        if not student_id:
            self.send_error_response("Missing student_id", 400)
            return
        
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM users WHERE id = ? AND role = 'student'", (student_id,))
            student = cursor.fetchone()
            
            if not student:
                self.send_error_response("Student not found", 404)
                return
            
            assessment = self.diagnostic_service.generate_initial_assessment(student_id)
            
            response = {
                "student_id": student_id,
                "assessment": assessment,
                "generated_at": datetime.now().isoformat()
            }
            
            conn.close()
            self.send_json_response(response)
            
        except Exception as e:
            self.send_error_response(f"Error generating diagnostic: {str(e)}")
    
    def handle_diagnostic_analyze(self, data):
        """Analyze diagnostic responses"""
        student_id = data.get("student_id")
        responses = data.get("responses", {})
        
        if not student_id or not responses:
            self.send_error_response("Missing student_id or responses", 400)
            return
        
        try:
            profile = self.diagnostic_service.analyze_responses(student_id, responses)
            
            # Store in database
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT id FROM student_learning_profiles WHERE student_id = ?", (student_id,))
            existing = cursor.fetchone()
            
            if existing:
                cursor.execute("""
                    UPDATE student_learning_profiles 
                    SET learning_style = ?, learning_style_confidence = ?, 
                        preferred_pace = ?, current_difficulty_level = ?,
                        interests = ?, strengths = ?, weaknesses = ?,
                        attention_span_minutes = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE student_id = ?
                """, (
                    profile["learning_style"], profile["confidence"],
                    profile["preferred_pace"], profile["difficulty_level"],
                    json.dumps(profile["interests"]), json.dumps(profile["strengths"]),
                    json.dumps(profile["weaknesses"]), profile["attention_span"],
                    student_id
                ))
            else:
                profile_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO student_learning_profiles 
                    (id, student_id, learning_style, learning_style_confidence,
                     preferred_pace, current_difficulty_level, interests, strengths, 
                     weaknesses, attention_span_minutes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    profile_id, student_id, profile["learning_style"], profile["confidence"],
                    profile["preferred_pace"], profile["difficulty_level"],
                    json.dumps(profile["interests"]), json.dumps(profile["strengths"]),
                    json.dumps(profile["weaknesses"]), profile["attention_span"]
                ))
            
            conn.commit()
            conn.close()
            
            response = {
                "student_id": student_id,
                "profile": profile,
                "analysis_timestamp": datetime.now().isoformat()
            }
            
            self.send_json_response(response)
            
        except Exception as e:
            self.send_error_response(f"Error analyzing diagnostic: {str(e)}")
    
    def handle_adaptive_path(self, student_id, data):
        """Generate adaptive learning path"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM student_learning_profiles WHERE student_id = ?", (student_id,))
            profile_row = cursor.fetchone()
            
            if not profile_row:
                self.send_error_response("Student learning profile not found", 404)
                return
            
            profile = {
                "learning_style": profile_row[2],
                "confidence": profile_row[3],
                "preferred_pace": profile_row[4],
                "difficulty_level": profile_row[5],
                "interests": json.loads(profile_row[6]) if profile_row[6] else [],
                "strengths": json.loads(profile_row[7]) if profile_row[7] else [],
                "weaknesses": json.loads(profile_row[8]) if profile_row[8] else []
            }
            
            cursor.execute("SELECT * FROM lessons WHERE is_published = 1 ORDER BY order_index")
            lessons = cursor.fetchall()
            
            content_items = []
            for lesson in lessons:
                content_items.append({
                    "id": lesson[0],
                    "title": lesson[2],
                    "content_type": lesson[4],
                    "difficulty": "beginner",
                    "estimated_duration": lesson[5]
                })
            
            adaptive_path = self.adaptive_path_service.generate_adaptive_path(student_id, profile, content_items)
            
            response = {
                "student_id": student_id,
                "adaptive_path": adaptive_path,
                "generated_at": datetime.now().isoformat()
            }
            
            conn.close()
            self.send_json_response(response)
            
        except Exception as e:
            self.send_error_response(f"Error generating adaptive path: {str(e)}")
    
    def handle_realtime_feedback(self, data):
        """Generate real-time feedback"""
        student_id = data.get("student_id")
        activity_data = data.get("activity_data", {})
        
        if not student_id or not activity_data:
            self.send_error_response("Missing student_id or activity_data", 400)
            return
        
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT learning_style FROM student_learning_profiles WHERE student_id = ?", (student_id,))
            profile_row = cursor.fetchone()
            learning_style = profile_row[0] if profile_row else "visual"
            
            feedback = self.feedback_service.generate_feedback(student_id, activity_data, learning_style)
            
            # Log activity
            activity_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO learning_activities 
                (id, student_id, lesson_id, activity_type, time_spent_seconds,
                 completion_percentage, interactions, correct_answers, total_attempts,
                 engagement_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                activity_id, student_id, activity_data.get("lesson_id", "unknown"),
                activity_data.get("activity_type", "general"), activity_data.get("time_spent", 0),
                activity_data.get("completion_percentage", 0), activity_data.get("interactions", 0),
                activity_data.get("correct_answers", 0), activity_data.get("total_attempts", 0),
                activity_data.get("engagement_score", 0.5)
            ))
            
            conn.commit()
            conn.close()
            
            response = {
                "student_id": student_id,
                "feedback": feedback,
                "timestamp": datetime.now().isoformat()
            }
            
            self.send_json_response(response)
            
        except Exception as e:
            self.send_error_response(f"Error generating feedback: {str(e)}")
    
    def handle_continuous_evaluation(self, data):
        """Perform continuous evaluation"""
        student_id = data.get("student_id")
        if not student_id:
            self.send_error_response("Missing student_id", 400)
            return
        
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM learning_activities 
                WHERE student_id = ? 
                ORDER BY start_time DESC 
                LIMIT 50
            """, (student_id,))
            
            activities = cursor.fetchall()
            
            if not activities:
                self.send_error_response("No learning activities found for student", 404)
                return
            
            activity_data = []
            for activity in activities:
                activity_data.append({
                    "completion_percentage": activity[9] if len(activity) > 9 else 0.0,
                    "time_spent_seconds": activity[8] if len(activity) > 8 else 0,
                    "correct_answers": activity[11] if len(activity) > 11 else 0,
                    "total_attempts": activity[12] if len(activity) > 12 else 0,
                    "engagement_score": activity[15] if len(activity) > 15 else 0.5
                })
            
            evaluation_result = self.evaluation_service.perform_evaluation(student_id, activity_data)
            
            response = {
                "student_id": student_id,
                "evaluation": evaluation_result,
                "timestamp": datetime.now().isoformat()
            }
            
            conn.close()
            self.send_json_response(response)
            
        except Exception as e:
            self.send_error_response(f"Error performing evaluation: {str(e)}")
    
    def handle_chat_process(self, data):
        """Process tutoring chat"""
        student_id = data.get("student_id")
        message = data.get("message", "")
        context = data.get("context", {})
        
        if not student_id or not message:
            self.send_error_response("Missing student_id or message", 400)
            return
        
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT learning_style FROM student_learning_profiles WHERE student_id = ?", (student_id,))
            profile_row = cursor.fetchone()
            learning_style = profile_row[0] if profile_row else "visual"
            
            response_data = self.tutoring_service.process_student_message(student_id, message, context, learning_style)
            
            response = {
                "student_id": student_id,
                "message": message,
                "response": response_data,
                "timestamp": datetime.now().isoformat()
            }
            
            conn.close()
            self.send_json_response(response)
            
        except Exception as e:
            self.send_error_response(f"Error processing chat: {str(e)}")
    
    def handle_get_student_profile(self, student_id):
        """Get student profile"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT slp.*, u.first_name, u.last_name, u.email
                FROM student_learning_profiles slp
                JOIN users u ON slp.student_id = u.id
                WHERE slp.student_id = ?
            """, (student_id,))
            
            row = cursor.fetchone()
            if not row:
                self.send_error_response("Student profile not found", 404)
                return
            
            profile = {
                "student_id": row[1],
                "learning_style": row[2],
                "confidence": row[3],
                "preferred_pace": row[4],
                "difficulty_level": row[5],
                "interests": json.loads(row[6]) if row[6] else [],
                "strengths": json.loads(row[7]) if row[7] else [],
                "weaknesses": json.loads(row[8]) if row[8] else [],
                "attention_span": row[9],
                "student_info": {
                    "name": f"{row[13]} {row[14]}",
                    "email": row[15]
                }
            }
            
            conn.close()
            self.send_json_response(profile)
            
        except Exception as e:
            self.send_error_response(f"Error getting profile: {str(e)}")

def run_server(port=5001):
    """Run the AI-Tutor server"""
    print(f"🚀 Iniciando AI-Tutor Service en puerto {port}...")
    print(f"🌐 Health check: http://localhost:{port}/health")
    print(f"📚 Base de datos: SQLite local")
    print(f"🧠 Servicios AI: 7 servicios activos")
    
    try:
        with socketserver.TCPServer(("", port), AITutorHandler) as httpd:
            print(f"✅ Servidor funcionando en http://localhost:{port}")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido por el usuario")
    except Exception as e:
        print(f"❌ Error iniciando servidor: {e}")

if __name__ == "__main__":
    run_server()