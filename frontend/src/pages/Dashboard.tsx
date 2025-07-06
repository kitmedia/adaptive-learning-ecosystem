import React, { useState, useEffect } from 'react';
import { BookOpen, TrendingUp, Users, Award, Clock, Target } from 'lucide-react';

interface CourseProgress {
  id: string;
  title: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  nextLesson: string;
}

interface AIRecommendation {
  id: string;
  type: string;
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

const Dashboard: React.FC = () => {
  const [studentData] = useState({
    name: 'Ana Estudiante',
    activeCourses: 3,
    totalProgress: 67,
    achievements: 12,
    studyTime: 24.5, // hours this week
    streak: 7 // days
  });

  const [courses] = useState<CourseProgress[]>([
    {
      id: '1',
      title: 'Introducción a la IA Adaptativa',
      progress: 75,
      totalLessons: 12,
      completedLessons: 9,
      nextLesson: 'Machine Learning Fundamentals'
    },
    {
      id: '2',
      title: 'Desarrollo Web Moderno',
      progress: 45,
      totalLessons: 16,
      completedLessons: 7,
      nextLesson: 'React Hooks Avanzados'
    },
    {
      id: '3',
      title: 'Data Science con Python',
      progress: 85,
      totalLessons: 10,
      completedLessons: 8,
      nextLesson: 'Visualización de Datos'
    }
  ]);

  const [recommendations] = useState<AIRecommendation[]>([
    {
      id: '1',
      type: 'content',
      title: 'Práctica Interactiva: Algoritmos ML',
      reason: 'Basado en tu progreso en IA, esto reforzará conceptos clave',
      priority: 'high'
    },
    {
      id: '2',
      type: 'study_group',
      title: 'Únete al grupo "React Masters"',
      reason: 'Estudiantes con nivel similar estudiando React',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'schedule',
      title: 'Sesión de repaso recomendada',
      reason: 'Para mantener tu racha de 7 días',
      priority: 'medium'
    }
  ]);

  // Simular llamada a API para obtener recomendaciones
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Aquí iría la llamada real a AI-Tutor service
        // const response = await fetch('/ai-tutor/api/recommendations/student_id/course_id');
        console.log('Fetching AI recommendations...');
        
        // Simular delay de red
        setTimeout(() => {
          console.log('AI recommendations loaded');
        }, 1000);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    };

    fetchRecommendations();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="dashboard p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Hola {studentData.name}! 👋
        </h1>
        <p className="text-gray-600">
          Continúa tu viaje de aprendizaje. Tienes {courses.length} cursos activos.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Cursos Activos</p>
              <p className="text-2xl font-bold text-blue-900">{studentData.activeCourses}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="stat-card bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Progreso General</p>
              <p className="text-2xl font-bold text-green-900">{studentData.totalProgress}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="stat-card bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Logros</p>
              <p className="text-2xl font-bold text-purple-900">{studentData.achievements}</p>
            </div>
            <Award className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="stat-card bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Horas esta semana</p>
              <p className="text-2xl font-bold text-orange-900">{studentData.studyTime}h</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Courses Progress */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Mis Cursos
            </h2>
            
            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className="course-card border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{course.title}</h3>
                    <span className="text-sm font-semibold text-blue-600">{course.progress}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>{course.completedLessons} de {course.totalLessons} lecciones</span>
                    <span className="text-blue-600">Siguiente: {course.nextLesson}</span>
                  </div>
                  
                  <button className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                    Continuar Aprendiendo
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Recomendaciones IA
            </h2>
            
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div key={rec.id} className={`recommendation-card border-l-4 p-3 rounded ${getPriorityColor(rec.priority)}`}>
                  <h4 className="font-medium text-gray-900 mb-1">{rec.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500 uppercase">{rec.priority}</span>
                    <button className="text-xs bg-white px-2 py-1 rounded border hover:bg-gray-50">
                      Ver más
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="mt-4 w-full text-blue-600 text-sm font-medium hover:text-blue-800">
              Ver todas las recomendaciones →
            </button>
          </div>

          {/* Study Group Quick Access */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Grupos de Estudio
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">React Study Group</p>
                  <p className="text-sm text-gray-600">3 miembros activos</p>
                </div>
                <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                  Unirse
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">IA & ML Beginners</p>
                  <p className="text-sm text-gray-600">5 miembros activos</p>
                </div>
                <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                  Unirse
                </button>
              </div>
            </div>
            
            <button className="mt-4 w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors">
              Crear Nuevo Grupo
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition-all">
            <BookOpen className="h-6 w-6 mb-2" />
            <span className="block font-medium">Explorar Cursos</span>
          </button>
          
          <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition-all">
            <Users className="h-6 w-6 mb-2" />
            <span className="block font-medium">Buscar Compañeros</span>
          </button>
          
          <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition-all">
            <Award className="h-6 w-6 mb-2" />
            <span className="block font-medium">Ver Logros</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;