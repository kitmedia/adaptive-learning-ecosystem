/**
 * Analytics Console - Enterprise Business Intelligence Dashboard
 * Adaptive Learning Ecosystem - EbroValley Digital
 * 
 * Consola de analytics empresarial con visualizaciones avanzadas y KPIs
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../ui/loading-spinner';
import { useAuth } from '../../hooks/useAuth';
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Clock,
  Target,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  Award,
  Brain,
  Zap,
  Globe,
  Activity,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalLearners: number;
    activeLearners: number;
    totalCourses: number;
    completionRate: number;
    avgStudyTime: number;
    engagementScore: number;
  };
  trends: {
    learnersGrowth: number;
    coursesGrowth: number;
    completionGrowth: number;
    revenueGrowth: number;
  };
  learningMetrics: {
    totalHoursStudied: number;
    averageSessionTime: number;
    coursesCompleted: number;
    certificatesEarned: number;
    topPerformers: Array<{
      id: string;
      name: string;
      score: number;
      courses: number;
    }>;
  };
  contentMetrics: {
    mostPopularCourses: Array<{
      id: string;
      title: string;
      enrollments: number;
      completionRate: number;
      rating: number;
    }>;
    contentEngagement: {
      videos: number;
      articles: number;
      quizzes: number;
      assignments: number;
    };
  };
  realtimeData: {
    activeUsers: number;
    ongoingSessions: number;
    completedToday: number;
    newEnrollments: number;
  };
  performanceInsights: {
    strongAreas: string[];
    improvementAreas: string[];
    recommendations: string[];
  };
}

const AnalyticsConsole: React.FC = () => {
  const { user, tenant } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
    
    // Auto-refresh every 5 minutes if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadAnalyticsData, 5 * 60 * 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/analytics/business-metrics?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        // Mock data for demonstration
        const mockData: AnalyticsData = {
          overview: {
            totalLearners: 12847,
            activeLearners: 3421,
            totalCourses: 245,
            completionRate: 73.5,
            avgStudyTime: 42.7,
            engagementScore: 85.2
          },
          trends: {
            learnersGrowth: 12.3,
            coursesGrowth: 8.7,
            completionGrowth: 5.2,
            revenueGrowth: 15.8
          },
          learningMetrics: {
            totalHoursStudied: 89542,
            averageSessionTime: 34.5,
            coursesCompleted: 1847,
            certificatesEarned: 962,
            topPerformers: [
              { id: '1', name: 'María García', score: 98.5, courses: 12 },
              { id: '2', name: 'Carlos Ruiz', score: 96.2, courses: 8 },
              { id: '3', name: 'Ana López', score: 94.8, courses: 15 },
              { id: '4', name: 'Pedro Martín', score: 93.1, courses: 6 },
              { id: '5', name: 'Laura Sánchez', score: 91.7, courses: 9 }
            ]
          },
          contentMetrics: {
            mostPopularCourses: [
              { id: '1', title: 'JavaScript Avanzado', enrollments: 1847, completionRate: 82.3, rating: 4.8 },
              { id: '2', title: 'Machine Learning Básico', enrollments: 1523, completionRate: 76.1, rating: 4.6 },
              { id: '3', title: 'React Profesional', enrollments: 1298, completionRate: 88.7, rating: 4.9 },
              { id: '4', title: 'Python para Data Science', enrollments: 1156, completionRate: 71.4, rating: 4.5 },
              { id: '5', title: 'DevOps Essentials', enrollments: 984, completionRate: 69.8, rating: 4.4 }
            ],
            contentEngagement: {
              videos: 78.5,
              articles: 65.3,
              quizzes: 89.2,
              assignments: 71.8
            }
          },
          realtimeData: {
            activeUsers: 234,
            ongoingSessions: 156,
            completedToday: 47,
            newEnrollments: 23
          },
          performanceInsights: {
            strongAreas: [
              'Alta tasa de finalización de cursos técnicos',
              'Excelente engagement en contenido interactivo',
              'Crecimiento constante de usuarios activos'
            ],
            improvementAreas: [
              'Reducir tiempo promedio de finalización',
              'Mejorar retención en cursos de larga duración',
              'Incrementar participación en foros'
            ],
            recommendations: [
              'Implementar gamificación en cursos largos',
              'Crear contenido microlearning para mejor retención',
              'Desarrollar sistema de mentorías peer-to-peer'
            ]
          }
        };
        setAnalyticsData(mockData);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const formatTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No se pudieron cargar los datos de analytics</p>
        <Button onClick={loadAnalyticsData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            📊 Analytics & Business Intelligence
          </h2>
          <p className="text-sm text-gray-600">
            Panel de control empresarial con métricas de aprendizaje y KPIs
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="1d">Último día</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-300' : ''}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Button size="sm" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <span>📈 Métricas en Tiempo Real</span>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center space-x-2">
                <Users className="h-6 w-6 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">
                  {formatNumber(analyticsData.realtimeData.activeUsers)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Usuarios Activos</p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center space-x-2">
                <Clock className="h-6 w-6 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {formatNumber(analyticsData.realtimeData.ongoingSessions)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Sesiones Activas</p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center space-x-2">
                <Award className="h-6 w-6 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">
                  {formatNumber(analyticsData.realtimeData.completedToday)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Completados Hoy</p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center space-x-2">
                <BookOpen className="h-6 w-6 text-orange-600" />
                <span className="text-2xl font-bold text-orange-600">
                  {formatNumber(analyticsData.realtimeData.newEnrollments)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Nuevas Inscripciones</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estudiantes Totales</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(analyticsData.overview.totalLearners)}
                </p>
                <div className="flex items-center space-x-1 mt-2">
                  {getTrendIcon(analyticsData.trends.learnersGrowth)}
                  <span className={`text-sm ${getTrendColor(analyticsData.trends.learnersGrowth)}`}>
                    {formatPercentage(analyticsData.trends.learnersGrowth)} vs período anterior
                  </span>
                </div>
              </div>
              <Users className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Finalización</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatPercentage(analyticsData.overview.completionRate)}
                </p>
                <div className="flex items-center space-x-1 mt-2">
                  {getTrendIcon(analyticsData.trends.completionGrowth)}
                  <span className={`text-sm ${getTrendColor(analyticsData.trends.completionGrowth)}`}>
                    {formatPercentage(analyticsData.trends.completionGrowth)} vs período anterior
                  </span>
                </div>
              </div>
              <Target className="h-12 w-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement Score</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatPercentage(analyticsData.overview.engagementScore)}
                </p>
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    Excelente engagement
                  </span>
                </div>
              </div>
              <Brain className="h-12 w-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tiempo Promedio/Sesión</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatTime(analyticsData.learningMetrics.averageSessionTime)}
                </p>
                <div className="flex items-center space-x-1 mt-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">
                    Duración ideal para retención
                  </span>
                </div>
              </div>
              <Clock className="h-12 w-12 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cursos Completados</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(analyticsData.learningMetrics.coursesCompleted)}
                </p>
                <div className="flex items-center space-x-1 mt-2">
                  <Award className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-gray-600">
                    {formatNumber(analyticsData.learningMetrics.certificatesEarned)} certificados
                  </span>
                </div>
              </div>
              <BookOpen className="h-12 w-12 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Horas de Estudio</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(analyticsData.learningMetrics.totalHoursStudied)}
                </p>
                <div className="flex items-center space-x-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">
                    Total acumulado
                  </span>
                </div>
              </div>
              <Globe className="h-12 w-12 text-teal-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers and Popular Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <span>🏆 Top Performers</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.learningMetrics.topPerformers.map((performer, index) => (
                <div key={performer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{performer.name}</p>
                      <p className="text-sm text-gray-600">{performer.courses} cursos completados</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">{formatPercentage(performer.score)}</p>
                    <p className="text-xs text-gray-600">Puntuación</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Most Popular Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>📚 Cursos Más Populares</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.contentMetrics.mostPopularCourses.map((course, index) => (
                <div key={course.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{course.title}</h4>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-600">
                          👥 {formatNumber(course.enrollments)} estudiantes
                        </span>
                        <span className="text-sm text-gray-600">
                          ✅ {formatPercentage(course.completionRate)}
                        </span>
                        <span className="text-sm text-gray-600">
                          ⭐ {course.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${course.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Engagement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-blue-600" />
            <span>👁️ Engagement por Tipo de Contenido</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle 
                    cx="40" cy="40" r="30" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    className="text-gray-200"
                  />
                  <circle 
                    cx="40" cy="40" r="30" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={`${(analyticsData.contentMetrics.contentEngagement.videos / 100) * 188.5} 188.5`}
                    className="text-red-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPercentage(analyticsData.contentMetrics.contentEngagement.videos)}
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">📹 Videos</p>
            </div>

            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle 
                    cx="40" cy="40" r="30" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    className="text-gray-200"
                  />
                  <circle 
                    cx="40" cy="40" r="30" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={`${(analyticsData.contentMetrics.contentEngagement.articles / 100) * 188.5} 188.5`}
                    className="text-blue-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPercentage(analyticsData.contentMetrics.contentEngagement.articles)}
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">📄 Artículos</p>
            </div>

            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle 
                    cx="40" cy="40" r="30" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    className="text-gray-200"
                  />
                  <circle 
                    cx="40" cy="40" r="30" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={`${(analyticsData.contentMetrics.contentEngagement.quizzes / 100) * 188.5} 188.5`}
                    className="text-green-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPercentage(analyticsData.contentMetrics.contentEngagement.quizzes)}
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">❓ Quizzes</p>
            </div>

            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle 
                    cx="40" cy="40" r="30" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    className="text-gray-200"
                  />
                  <circle 
                    cx="40" cy="40" r="30" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={`${(analyticsData.contentMetrics.contentEngagement.assignments / 100) * 188.5} 188.5`}
                    className="text-purple-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPercentage(analyticsData.contentMetrics.contentEngagement.assignments)}
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">📝 Tareas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <TrendingUp className="h-5 w-5" />
              <span>💪 Fortalezas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analyticsData.performanceInsights.strongAreas.map((area, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">✅</span>
                  <span className="text-sm text-green-800">{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <Target className="h-5 w-5" />
              <span>⚠️ Áreas de Mejora</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analyticsData.performanceInsights.improvementAreas.map((area, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-yellow-600 mt-1">⚡</span>
                  <span className="text-sm text-yellow-800">{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Brain className="h-5 w-5" />
              <span>💡 Recomendaciones</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analyticsData.performanceInsights.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">💡</span>
                  <span className="text-sm text-blue-800">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsConsole;