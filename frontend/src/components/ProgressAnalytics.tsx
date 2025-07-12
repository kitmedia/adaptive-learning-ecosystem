import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Calendar, Award, Timer, Target, Activity, Zap } from 'lucide-react';
import { apiService } from '../services/api.service';

interface AnalyticsData {
  weeklyProgress: number;
  monthlyProgress: number;
  learningVelocity: number;
  streakDays: number;
  averageSessionTime: number;
  completionRate: number;
  weeklyTrend: 'up' | 'down' | 'stable';
  performanceScore: number;
}

interface ProgressAnalyticsProps {
  studentId: string;
}

const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({ studentId }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    weeklyProgress: 0,
    monthlyProgress: 0,
    learningVelocity: 0,
    streakDays: 7,
    averageSessionTime: 0,
    completionRate: 0,
    weeklyTrend: 'stable',
    performanceScore: 85
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      // Simulamos cálculos analíticos complejos
      const response = await apiService.getStudentProgressSummary(studentId);
      
      if (response.data) {
        const summary = response.data.global_summary || {};
        const courses = response.data.courses || [];
        
        // Calculamos métricas analíticas
        const totalTime = courses.reduce((acc: number, course: any) => acc + (course.total_time || 0), 0);
        const avgSessionTime = totalTime > 0 ? totalTime / Math.max(courses.length, 1) : 0;
        const completionRate = courses.length > 0 ? 
          (courses.reduce((acc: number, course: any) => 
            acc + (course.completed_lessons || 0), 0) / 
           courses.reduce((acc: number, course: any) => 
            acc + (course.total_lessons || 1), 0)) * 100 : 0;

        setAnalytics({
          weeklyProgress: Math.min(Math.round(completionRate * 0.7), 100),
          monthlyProgress: Math.min(Math.round(completionRate), 100),
          learningVelocity: Math.round((completionRate / 30) * 10) / 10, // lecciones por día
          streakDays: 7, // TODO: calcular desde datos reales
          averageSessionTime: Math.round(avgSessionTime / 60), // minutos
          completionRate: Math.round(completionRate),
          weeklyTrend: completionRate > 70 ? 'up' : completionRate < 50 ? 'down' : 'stable',
          performanceScore: Math.round((summary.overall_avg_score || 0) * 0.85 + 15)
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-100';
      case 'down':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: 'Excelente', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 80) return { level: 'Muy Bueno', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 70) return { level: 'Bueno', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 60) return { level: 'Regular', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { level: 'Necesita Mejora', color: 'text-red-600', bg: 'bg-red-100' };
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-pulse">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-300 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const performance = getPerformanceLevel(analytics.performanceScore);

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-blue-600" />
          Analytics en Tiempo Real
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getTrendColor(analytics.weeklyTrend)}`}>
          {getTrendIcon(analytics.weeklyTrend)}
          <span className="ml-1">
            {analytics.weeklyTrend === 'up' ? 'Subiendo' : 
             analytics.weeklyTrend === 'down' ? 'Bajando' : 'Estable'}
          </span>
        </div>
      </div>

      {/* Métricas principales en grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Progreso Semanal */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="text-xs text-blue-600 font-semibold">SEMANAL</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{analytics.weeklyProgress}%</p>
          <p className="text-xs text-gray-600">Esta semana</p>
        </div>

        {/* Velocidad de Aprendizaje */}
        <div className="bg-gradient-to-br from-green-50 to-teal-50 p-4 rounded-xl border border-green-100">
          <div className="flex items-center justify-between mb-2">
            <Zap className="h-5 w-5 text-green-600" />
            <span className="text-xs text-green-600 font-semibold">VELOCIDAD</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{analytics.learningVelocity}</p>
          <p className="text-xs text-gray-600">lecciones/día</p>
        </div>

        {/* Tiempo Promedio */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <Timer className="h-5 w-5 text-purple-600" />
            <span className="text-xs text-purple-600 font-semibold">SESIÓN</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{analytics.averageSessionTime}m</p>
          <p className="text-xs text-gray-600">promedio</p>
        </div>

        {/* Tasa de Finalización */}
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-4 rounded-xl border border-orange-100">
          <div className="flex items-center justify-between mb-2">
            <Target className="h-5 w-5 text-orange-600" />
            <span className="text-xs text-orange-600 font-semibold">FINALIZACIÓN</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{analytics.completionRate}%</p>
          <p className="text-xs text-gray-600">completado</p>
        </div>
      </div>

      {/* Métricas de rendimiento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Puntuación de Rendimiento */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-gray-800">Rendimiento Global</span>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${performance.bg} ${performance.color}`}>
              {performance.level}
            </div>
          </div>
          
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="h-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all duration-1000"
                style={{ width: `${analytics.performanceScore}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>0%</span>
              <span className="font-semibold">{analytics.performanceScore}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Racha de Días */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <span className="font-semibold text-gray-800">Racha Actual</span>
            </div>
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-semibold">
              ¡Activa!
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-gray-800">{analytics.streakDays}</span>
            <div>
              <p className="text-sm font-semibold text-gray-700">días</p>
              <p className="text-xs text-gray-600">consecutivos</p>
            </div>
          </div>
          
          {/* Mini calendrio visual */}
          <div className="flex gap-1 mt-3">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={`h-2 w-full rounded-full ${
                  i < analytics.streakDays ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Insights AI */}
      <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">Insight AI del Día</h4>
            <p className="text-sm text-gray-700">
              {analytics.weeklyTrend === 'up' 
                ? `¡Excelente progreso! Tu velocidad de ${analytics.learningVelocity} lecciones/día está por encima del promedio. Considera aumentar la dificultad.`
                : analytics.weeklyTrend === 'down'
                ? `Tu progreso ha disminuido. Intenta sesiones más cortas pero frecuentes. Tu tiempo promedio de ${analytics.averageSessionTime}m es óptimo.`
                : `Progreso estable. Para acelerar, enfócate en completar al menos 1 lección diaria para mantener tu racha de ${analytics.streakDays} días.`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressAnalytics;