import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Clock, Target, BookOpen, Star, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import { apiService } from '../services/api.service';

interface LessonProgress {
  lesson_id: string;
  lesson_name: string;
  progress_percentage: number;
  time_spent: number;
  last_accessed: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  attempts: number;
}

interface CourseProgress {
  course_id: string;
  course_name: string;
  overall_progress: number;
  completed_lessons: number;
  total_lessons: number;
  total_time: number;
  avg_score: number;
  lessons: LessonProgress[];
  last_activity: string;
}

interface ProgressTrackerProps {
  studentId: string;
  compact?: boolean;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ studentId, compact = false }) => {
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  const fetchProgressData = useCallback(async () => {
    try {
      const response = await apiService.getStudentProgressSummary(studentId);
      
      if (response.data && response.data.courses) {
        const courses = response.data.courses.map((course: any) => ({
          course_id: course.course_id,
          course_name: course.course_name || 'Curso sin título',
          overall_progress: Math.round((course.completed_lessons / course.total_lessons) * 100) || 0,
          completed_lessons: course.completed_lessons || 0,
          total_lessons: course.total_lessons || 0,
          total_time: course.total_time || 0,
          avg_score: course.avg_score || 0,
          lessons: course.lessons || [],
          last_activity: course.last_activity || new Date().toISOString()
        }));
        setCourseProgress(courses);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchProgressData();
  }, [fetchProgressData, timeRange]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 70) return 'text-blue-600 bg-blue-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-300 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Progreso Rápido
          </h3>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="text-sm border rounded-lg px-2 py-1 bg-white"
          >
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="all">Todo el tiempo</option>
          </select>
        </div>
        
        <div className="space-y-3">
          {courseProgress.slice(0, 3).map((course) => (
            <div key={course.course_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">{course.course_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${course.overall_progress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600">{course.overall_progress}%</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700">{course.completed_lessons}/{course.total_lessons}</p>
                <p className="text-xs text-gray-500">{formatTime(course.total_time)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con métricas generales */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
            Seguimiento de Progreso Detallado
          </h2>
          <div className="flex gap-2">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="border rounded-lg px-3 py-2 bg-white font-medium"
            >
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="all">Todo el tiempo</option>
            </select>
            <button className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-200 transition-colors">
              📊 Exportar
            </button>
          </div>
        </div>

        {/* Métricas globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
            <p className="text-sm font-semibold text-blue-600">Cursos Activos</p>
            <p className="text-2xl font-bold text-gray-800">{courseProgress.length}</p>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-xl">
            <p className="text-sm font-semibold text-green-600">Lecciones Completadas</p>
            <p className="text-2xl font-bold text-gray-800">
              {courseProgress.reduce((acc, course) => acc + course.completed_lessons, 0)}
            </p>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl">
            <p className="text-sm font-semibold text-purple-600">Tiempo Total</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatTime(courseProgress.reduce((acc, course) => acc + course.total_time, 0))}
            </p>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl">
            <p className="text-sm font-semibold text-yellow-600">Promedio General</p>
            <p className="text-2xl font-bold text-gray-800">
              {Math.round(courseProgress.reduce((acc, course) => acc + course.avg_score, 0) / courseProgress.length || 0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Lista de cursos con progreso detallado */}
      <div className="grid gap-6">
        {courseProgress.map((course) => (
          <div key={course.course_id} className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{course.course_name}</h3>
                  <p className="text-sm text-gray-600">
                    Última actividad: {formatDate(course.last_activity)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getProgressColor(course.overall_progress)}`}>
                  {course.overall_progress}% completado
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {course.completed_lessons} de {course.total_lessons} lecciones
                </p>
              </div>
            </div>

            {/* Barra de progreso principal */}
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 relative"
                  style={{ width: `${course.overall_progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Inicio</span>
                <span>{course.overall_progress}%</span>
                <span>Completado</span>
              </div>
            </div>

            {/* Métricas del curso */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Tiempo invertido</p>
                  <p className="text-lg font-bold text-gray-800">{formatTime(course.total_time)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Puntuación media</p>
                  <p className="text-lg font-bold text-gray-800">{course.avg_score}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Rendimiento</p>
                  <p className="text-lg font-bold text-gray-800">
                    {course.avg_score >= 90 ? 'Excelente' : 
                     course.avg_score >= 70 ? 'Bueno' : 
                     course.avg_score >= 50 ? 'Regular' : 'Necesita mejora'}
                  </p>
                </div>
              </div>
            </div>

            {/* Botón para expandir detalles */}
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setSelectedCourse(
                  selectedCourse === course.course_id ? null : course.course_id
                )}
                className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
              >
                {selectedCourse === course.course_id ? '▼ Ocultar detalles' : '▶ Ver detalles de lecciones'}
              </button>
              <div className="flex gap-2">
                <button className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors">
                  📈 Analizar
                </button>
                <button className="bg-green-100 text-green-600 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-green-200 transition-colors">
                  🎯 Continuar
                </button>
              </div>
            </div>

            {/* Detalles de lecciones expandibles */}
            {selectedCourse === course.course_id && (
              <div className="mt-6 border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-3">Progreso por lección</h4>
                <div className="space-y-2">
                  {course.lessons.map((lesson) => (
                    <div key={lesson.lesson_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(lesson.status)}
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{lesson.lesson_name}</p>
                          <p className="text-xs text-gray-600">
                            {formatDate(lesson.last_accessed)} • {lesson.attempts} intentos
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${lesson.progress_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 w-10">{lesson.progress_percentage}%</span>
                        {lesson.score && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {lesson.score}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressTracker;