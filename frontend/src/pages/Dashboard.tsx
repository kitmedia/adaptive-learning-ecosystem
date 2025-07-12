import React, { useState, useEffect } from 'react';
import { BookOpen, TrendingUp, Users, Award, Clock, Target, Trophy } from 'lucide-react';
import EducationalKPIs from '../components/EducationalKPIs';
import ProgressTracker from '../components/ProgressTracker';
import ProgressAnalytics from '../components/ProgressAnalytics';
import GamificationSystem from '../components/GamificationSystem';
import EducationalDesignPrinciples from '../components/EducationalDesignPrinciples';
import CustomProgressWidget from '../components/CustomProgressWidget';
import EducationalNotifications from '../components/EducationalNotifications';
import { apiService } from '../services/api.service';

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

interface DashboardProps {
  setCurrentPage: (page: 'dashboard' | 'diagnostic' | 'assessment' | 'gamification') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setCurrentPage }) => {
  const [studentData] = useState({
    id: '550e8400-e29b-41d4-a716-446655440003', // ID del estudiante de prueba
    name: 'Ana Estudiante',
    activeCourses: 3,
    totalProgress: 67,
    achievements: 12,
    studyTime: 24.5, // hours this week
    streak: 7 // days
  });
  
  const [realTimeData, setRealTimeData] = useState({
    healthStatus: {
      progress: false,
      assessment: false,
      loading: true
    }
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

  // Verificar servicios y obtener datos reales
  useEffect(() => {
    const checkServices = async () => {
      try {
        const [progressHealth, assessmentHealth] = await Promise.all([
          apiService.checkProgressHealth(),
          apiService.checkAssessmentHealth(),
        ]);

        setRealTimeData(prev => ({
          ...prev,
          healthStatus: {
            progress: progressHealth.status === 200,
            assessment: assessmentHealth.status === 200,
            loading: false
          }
        }));
      } catch (error) {
        console.error('Error checking services:', error);
        setRealTimeData(prev => ({
          ...prev,
          healthStatus: {
            progress: false,
            assessment: false,
            loading: false
          }
        }));
      }
    };

    checkServices();
  }, []);


  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-block p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-6">
          <span className="text-4xl text-white">📊</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          ¡Hola {studentData.name}! 👋
        </h1>
        <p className="text-xl text-blue-100 max-w-2xl mx-auto">
          Continúa tu viaje de aprendizaje. Tienes {courses.length} cursos activos y {studentData.achievements} logros desbloqueados.
        </p>
        
        {/* Streak Badge */}
        <div className="inline-flex items-center mt-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full px-4 py-2">
          <span className="text-2xl mr-2">🔥</span>
          <span className="text-white font-semibold">{studentData.streak} días de racha</span>
        </div>
      </div>

      {/* Educational KPIs with Real Data */}
      <div className="mb-8">
        <EducationalKPIs studentId={studentData.id} />
      </div>

      {/* Progress Analytics */}
      <div className="mb-8">
        <ProgressAnalytics studentId={studentData.id} />
      </div>

      {/* Educational Design Principles */}
      <div className="mb-8">
        <EducationalDesignPrinciples studentId={studentData.id} />
      </div>

      {/* Custom Progress Widgets */}
      <div className="mb-8">
        <CustomProgressWidget studentId={studentData.id} editable={true} />
      </div>

      {/* Service Status Indicator */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Estado del Ecosistema</h2>
        <div className="flex gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            realTimeData.healthStatus.progress ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${realTimeData.healthStatus.progress ? 'bg-green-500' : 'bg-red-500'}`}></div>
            Progress Tracking
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            realTimeData.healthStatus.assessment ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${realTimeData.healthStatus.assessment ? 'bg-green-500' : 'bg-red-500'}`}></div>
            Assessment Engine
          </div>
        </div>
      </div>

      {/* Legacy Stats Overview (for comparison) */}
      <div className="opacity-50 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">📊 Métricas Estáticas (para comparación)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide">Cursos Activos</p>
              <p className="text-3xl font-bold text-gray-800">{studentData.activeCourses}</p>
              <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-2"></div>
            </div>
            <div className="p-3 bg-blue-100 rounded-2xl">
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-semibold uppercase tracking-wide">Progreso General</p>
              <p className="text-3xl font-bold text-gray-800">{studentData.totalProgress}%</p>
              <div className="w-8 h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full mt-2"></div>
            </div>
            <div className="p-3 bg-green-100 rounded-2xl">
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-semibold uppercase tracking-wide">Logros</p>
              <p className="text-3xl font-bold text-gray-800">{studentData.achievements}</p>
              <div className="w-8 h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mt-2"></div>
            </div>
            <div className="p-3 bg-purple-100 rounded-2xl">
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-semibold uppercase tracking-wide">Horas Semana</p>
              <p className="text-3xl font-bold text-gray-800">{studentData.studyTime}h</p>
              <div className="w-8 h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mt-2"></div>
            </div>
            <div className="p-3 bg-orange-100 rounded-2xl">
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Tracker Avanzado */}
        <div className="lg:col-span-2">
          <ProgressTracker studentId={studentData.id} />
        </div>

        {/* Gamification System Compacto */}
        <div>
          <GamificationSystem studentId={studentData.id} compact={true} />
          
          {/* Educational Notifications Compact */}
          <div className="mt-6">
            <EducationalNotifications studentId={studentData.id} compact={true} />
          </div>
          
          {/* Progress Tracker Compacto */}
          <div className="mt-6">
            <ProgressTracker studentId={studentData.id} compact={true} />
          </div>
          
          {/* AI Recommendations */}
          <div className="glass-card rounded-2xl p-6 mt-6">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-purple-100 rounded-xl mr-3">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Recomendaciones IA</h2>
            </div>
            
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="glass p-4 rounded-xl hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-800 text-sm">{rec.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {rec.priority === 'high' ? '🔥' : rec.priority === 'medium' ? '⚡' : '✅'} {rec.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{rec.reason}</p>
                  <button className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full hover:shadow-lg transition-all duration-200">
                    Ver más →
                  </button>
                </div>
              ))}
            </div>
            
            <button className="mt-6 w-full glass p-3 rounded-xl text-blue-600 font-semibold hover:bg-blue-50 transition-all duration-200">
              🔍 Ver todas las recomendaciones
            </button>
          </div>

          {/* Study Group Quick Access */}
          <div className="glass-card rounded-2xl p-6 mt-6">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-green-100 rounded-xl mr-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Grupos de Estudio</h2>
            </div>
            
            <div className="space-y-4">
              <div className="glass p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">React Study Group</p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      3 miembros activos
                    </p>
                  </div>
                  <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-200">
                    🚀 Unirse
                  </button>
                </div>
              </div>
              
              <div className="glass p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">IA & ML Beginners</p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      5 miembros activos
                    </p>
                  </div>
                  <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-200">
                    🚀 Unirse
                  </button>
                </div>
              </div>
            </div>
            
            <button className="mt-6 w-full btn-primary">
              ➕ Crear Nuevo Grupo
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 glass-card rounded-2xl p-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center mb-6">
          <div className="inline-block p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
            <span className="text-2xl text-white">⚡</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Acciones Rápidas</h2>
          <p className="text-gray-600">Acelera tu aprendizaje con estas herramientas</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => setCurrentPage('assessment')}
            className="glass p-6 rounded-2xl hover:scale-105 transition-all duration-300 group bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200"
          >
            <div className="p-3 bg-purple-100 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <span className="block font-semibold text-gray-800 text-lg">Evaluaciones AI</span>
            <p className="text-sm text-gray-600 mt-2">Prueba tus conocimientos</p>
            <div className="mt-3 flex justify-center">
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                🎯 Adaptativas
              </span>
            </div>
          </button>
          
          <button 
            onClick={() => setCurrentPage('diagnostic')}
            className="glass p-6 rounded-2xl hover:scale-105 transition-all duration-300 group bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200"
          >
            <div className="p-3 bg-blue-100 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <span className="block font-semibold text-gray-800 text-lg">Diagnóstico AI</span>
            <p className="text-sm text-gray-600 mt-2">Análisis personalizado</p>
            <div className="mt-3 flex justify-center">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                🧠 Machine Learning
              </span>
            </div>
          </button>
          
          <button 
            onClick={() => setCurrentPage('gamification')}
            className="glass p-6 rounded-2xl hover:scale-105 transition-all duration-300 group bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200"
          >
            <div className="p-3 bg-yellow-100 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-yellow-200 transition-colors">
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
            <span className="block font-semibold text-gray-800 text-lg">Mis Logros</span>
            <p className="text-sm text-gray-600 mt-2">Badges y gamificación</p>
            <div className="mt-3 flex justify-center">
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                🏆 Nivel {Math.floor(studentData.totalProgress / 10) + 1}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;