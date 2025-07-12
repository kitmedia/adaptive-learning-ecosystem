import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Award, Clock, Target, Zap, BookOpen } from 'lucide-react';
import { apiService } from '../services/api.service';

interface KPIData {
  totalProgress: number;
  completedLessons: number;
  totalLessons: number;
  studyTimeHours: number;
  currentStreak: number;
  badges: number;
  avgScore: number;
  activeCourses: number;
}

interface EducationalKPIsProps {
  studentId: string;
}

const EducationalKPIs: React.FC<EducationalKPIsProps> = ({ studentId }) => {
  const [kpiData, setKpiData] = useState<KPIData>({
    totalProgress: 0,
    completedLessons: 0,
    totalLessons: 0,
    studyTimeHours: 0,
    currentStreak: 0,
    badges: 0,
    avgScore: 0,
    activeCourses: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchKPIData = useCallback(async () => {
    try {
      const response = await apiService.getStudentProgressSummary(studentId);
      
      if (response.data && (response.data as any).global_summary) {
        const summary = (response.data as any).global_summary;
        const courses = (response.data as any).courses || [];
        
        // Calcular métricas agregadas
        const totalCompleted = courses.reduce((acc: number, course: any) => 
          acc + (course.completed_lessons || 0), 0
        );
        const totalLessons = courses.reduce((acc: number, course: any) => 
          acc + (course.total_lessons || 0), 0
        );
        const totalTimeHours = (summary.total_time || 0) / 3600;
        
        setKpiData({
          totalProgress: totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0,
          completedLessons: totalCompleted,
          totalLessons: totalLessons,
          studyTimeHours: Math.round(totalTimeHours * 10) / 10,
          currentStreak: 7, // TODO: Calcular desde datos reales
          badges: 12, // TODO: Implementar sistema de badges
          avgScore: Math.round((summary.overall_avg_score || 0) * 10) / 10,
          activeCourses: summary.active_courses || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchKPIData();
  }, [fetchKPIData]);

  const CircularProgress = ({ value, max = 100, size = 120, strokeWidth = 8 }: any) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / max) * circumference;

    return (
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-blue-600 transition-all duration-1000 ease-out"
        />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
            <div className="w-16 h-16 bg-gray-300 rounded-xl mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Progreso General */}
        <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-all duration-300">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-800">{kpiData.totalProgress}%</p>
                <p className="text-sm text-gray-600">Completado</p>
              </div>
            </div>
            <CircularProgress value={kpiData.totalProgress} />
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm font-semibold text-gray-700">Progreso General</p>
            <p className="text-xs text-gray-500 mt-1">
              {kpiData.completedLessons} de {kpiData.totalLessons} lecciones
            </p>
          </div>
        </div>

        {/* Tiempo de Estudio */}
        <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-all duration-300 bg-gradient-to-br from-purple-50 to-indigo-50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-2xl">
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <Zap className="h-5 w-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{kpiData.studyTimeHours}h</p>
          <p className="text-sm font-semibold text-gray-700 mt-2">Tiempo de Estudio</p>
          <div className="mt-3 flex items-center text-xs text-purple-600">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>+15% esta semana</span>
          </div>
        </div>

        {/* Racha de Días */}
        <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-all duration-300 bg-gradient-to-br from-orange-50 to-red-50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-2xl">
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
            <span className="text-2xl">🔥</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{kpiData.currentStreak}</p>
          <p className="text-sm font-semibold text-gray-700 mt-2">Días de Racha</p>
          <div className="mt-3">
            <div className="flex gap-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-full rounded-full ${
                    i < kpiData.currentStreak ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Puntuación Promedio */}
        <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-all duration-300 bg-gradient-to-br from-green-50 to-teal-50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-2xl">
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <Award className="h-5 w-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{kpiData.avgScore}%</p>
          <p className="text-sm font-semibold text-gray-700 mt-2">Puntuación Media</p>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-green-600">Excelente</span>
            <span className="text-gray-500">{kpiData.badges} badges</span>
          </div>
        </div>
      </div>

      {/* Widget de Progreso Detallado */}
      <div className="glass-card rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <BookOpen className="h-6 w-6 mr-2 text-blue-600" />
            Cursos Activos
          </h3>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
            {kpiData.activeCourses} cursos
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <p className="text-3xl font-bold text-blue-600">{kpiData.completedLessons}</p>
            <p className="text-sm text-gray-600 mt-1">Lecciones Completadas</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
            <p className="text-3xl font-bold text-purple-600">{kpiData.badges}</p>
            <p className="text-sm text-gray-600 mt-1">Logros Desbloqueados</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl">
            <p className="text-3xl font-bold text-green-600">A+</p>
            <p className="text-sm text-gray-600 mt-1">Rendimiento General</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationalKPIs;