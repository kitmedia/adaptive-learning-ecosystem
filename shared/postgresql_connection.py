"""
PostgreSQL Connection Manager
Adaptive Learning Ecosystem - EbroValley Digital
Shared module for database connections across services
"""

import os
import psycopg2
import asyncpg
from psycopg2.pool import SimpleConnectionPool
from contextlib import asynccontextmanager
import logging
from typing import Optional, Dict, Any
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# PostgreSQL Configuration
POSTGRES_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': int(os.getenv('POSTGRES_PORT', '5432')),
    'database': os.getenv('POSTGRES_DB', 'adaptive_learning'),
    'user': os.getenv('POSTGRES_USER', 'adaptive_user'),
    'password': os.getenv('POSTGRES_PASSWORD', 'adaptive_password_2024')
}

# Connection pool for synchronous operations
connection_pool: Optional[SimpleConnectionPool] = None

def init_connection_pool():
    """
    Acción específica: Inicializar pool de conexiones PostgreSQL
    Razón: Optimizar rendimiento con múltiples conexiones concurrentes
    """
    global connection_pool
    try:
        connection_pool = SimpleConnectionPool(
            minconn=1,
            maxconn=20,
            **POSTGRES_CONFIG
        )
        logger.info("✅ PostgreSQL connection pool initialized")
        return True
    except Exception as e:
        logger.error(f"❌ Error initializing connection pool: {e}")
        return False

def get_connection():
    """
    Acción específica: Obtener conexión del pool
    Razón: Reutilizar conexiones para mejor rendimiento
    """
    global connection_pool
    if connection_pool is None:
        if not init_connection_pool():
            raise Exception("Failed to initialize connection pool")
    return connection_pool.getconn()

def return_connection(conn):
    """
    Acción específica: Devolver conexión al pool
    Razón: Liberar recursos para otras operaciones
    """
    global connection_pool
    if connection_pool:
        connection_pool.putconn(conn)

class PostgreSQLManager:
    """
    Clase para gestión avanzada de PostgreSQL
    """
    
    def __init__(self):
        self.config = POSTGRES_CONFIG
        
    def execute_query(self, query: str, params: tuple = None) -> Dict[str, Any]:
        """
        Acción específica: Ejecutar query con manejo de errores
        Razón: Centralizar ejecución de queries con logging
        """
        conn = None
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            cursor.execute(query, params)
            
            if query.strip().upper().startswith('SELECT'):
                results = cursor.fetchall()
                columns = [desc[0] for desc in cursor.description]
                data = [dict(zip(columns, row)) for row in results]
                return {'success': True, 'data': data, 'count': len(results)}
            else:
                conn.commit()
                return {'success': True, 'affected_rows': cursor.rowcount}
                
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"❌ Database error: {e}")
            return {'success': False, 'error': str(e)}
        finally:
            if conn:
                return_connection(conn)
    
    def get_student_progress(self, student_id: str) -> Dict[str, Any]:
        """
        Acción específica: Obtener progreso completo del estudiante
        Razón: Función optimizada para dashboard y analytics
        """
        query = """
        SELECT 
            sp.*,
            l.title as lesson_title,
            l.difficulty_level,
            c.title as course_title,
            c.difficulty_level as course_difficulty
        FROM student_progress sp
        JOIN lessons l ON sp.lesson_id = l.id
        JOIN courses c ON sp.course_id = c.id
        WHERE sp.student_id = %s
        ORDER BY c.title, l.order_index
        """
        return self.execute_query(query, (student_id,))
    
    def get_student_summary(self, student_id: str) -> Dict[str, Any]:
        """
        Acción específica: Obtener resumen ejecutivo del estudiante
        Razón: KPIs y métricas para el dashboard principal
        """
        query = """
        SELECT 
            COUNT(DISTINCT sp.course_id) as active_courses,
            COUNT(CASE WHEN sp.status = 'completed' THEN 1 END) as completed_lessons,
            COUNT(*) as total_lessons,
            COALESCE(AVG(sp.score), 0) as overall_avg_score,
            COALESCE(SUM(sp.time_spent), 0) as total_time,
            MAX(sp.last_accessed) as last_activity
        FROM student_progress sp
        WHERE sp.student_id = %s
        """
        return self.execute_query(query, (student_id,))
    
    def get_gamification_data(self, student_id: str) -> Dict[str, Any]:
        """
        Acción específica: Obtener datos de gamificación
        Razón: Sistema de badges, puntos y logros
        """
        query = """
        SELECT * FROM gamification WHERE student_id = %s
        """
        return self.execute_query(query, (student_id,))
    
    def update_student_progress(self, progress_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Acción específica: Actualizar progreso del estudiante
        Razón: Mantener tracking en tiempo real
        """
        query = """
        INSERT INTO student_progress (student_id, lesson_id, course_id, status, progress_percentage, time_spent, score, last_accessed)
        VALUES (%(student_id)s, %(lesson_id)s, %(course_id)s, %(status)s, %(progress_percentage)s, %(time_spent)s, %(score)s, CURRENT_TIMESTAMP)
        ON CONFLICT (student_id, lesson_id) 
        DO UPDATE SET
            status = EXCLUDED.status,
            progress_percentage = EXCLUDED.progress_percentage,
            time_spent = student_progress.time_spent + EXCLUDED.time_spent,
            score = EXCLUDED.score,
            last_accessed = EXCLUDED.last_accessed,
            updated_at = CURRENT_TIMESTAMP
        """
        return self.execute_query(query, progress_data)

# Async PostgreSQL Manager
class AsyncPostgreSQLManager:
    """
    Clase para operaciones asíncronas con PostgreSQL
    """
    
    def __init__(self):
        self.config = POSTGRES_CONFIG
        self.connection_string = f"postgresql://{self.config['user']}:{self.config['password']}@{self.config['host']}:{self.config['port']}/{self.config['database']}"
    
    @asynccontextmanager
    async def get_connection(self):
        """
        Acción específica: Obtener conexión asíncrona
        Razón: Operaciones no bloqueantes para alta concurrencia
        """
        conn = None
        try:
            conn = await asyncpg.connect(self.connection_string)
            yield conn
        finally:
            if conn:
                await conn.close()
    
    async def execute_query(self, query: str, *params) -> Dict[str, Any]:
        """
        Acción específica: Ejecutar query asíncrono
        Razón: Mejor rendimiento en operaciones concurrentes
        """
        try:
            async with self.get_connection() as conn:
                if query.strip().upper().startswith('SELECT'):
                    results = await conn.fetch(query, *params)
                    return {
                        'success': True, 
                        'data': [dict(row) for row in results],
                        'count': len(results)
                    }
                else:
                    result = await conn.execute(query, *params)
                    return {'success': True, 'result': result}
        except Exception as e:
            logger.error(f"❌ Async database error: {e}")
            return {'success': False, 'error': str(e)}

# Singleton instances
postgresql_manager = PostgreSQLManager()
async_postgresql_manager = AsyncPostgreSQLManager()

def test_connection():
    """
    Acción específica: Probar conexión PostgreSQL
    Razón: Verificar configuración antes de usar en producción
    """
    try:
        result = postgresql_manager.execute_query("SELECT version()")
        if result['success']:
            logger.info(f"✅ PostgreSQL connection successful: {result['data'][0]['version']}")
            return True
        else:
            logger.error(f"❌ PostgreSQL connection failed: {result.get('error', 'Unknown error')}")
            return False
    except Exception as e:
        logger.error(f"❌ PostgreSQL connection test failed: {e}")
        return False

if __name__ == "__main__":
    # Test the connection
    print("🔍 Testing PostgreSQL connection...")
    if test_connection():
        print("✅ PostgreSQL ready for production!")
    else:
        print("❌ PostgreSQL connection failed!")