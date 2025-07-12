import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  TrendingUp, 
  Award, 
  Clock, 
  Target, 
  Trophy,
  Activity,
  Brain,
  Star
} from 'lucide-react';
import StatCard from '../components/ui/stat-card';
import ProgressChart from '../components/charts/ProgressChart';
import Breadcrumbs from '../components/ui/breadcrumbs';
import SearchBar from '../components/ui/search-bar';
import { apiService } from '../services/api.service';

interface DashboardProfessionalProps {
  setCurrentPage: (page: 'dashboard' | 'diagnostic' | 'assessment' | 'gamification' | 'pricing') => void;
}

interface StudentMetrics {
  id: string;
  name: string;
  activeCourses: number;
  totalProgress: number;
  achievements: number;
  studyTime: number;
  streak: number;
  weeklyGoal: number;
  currentLevel: number;
}

const DashboardProfessional: React.FC<DashboardProfessionalProps> = ({ setCurrentPage }) => {
  const [studentData] = useState<StudentMetrics>({
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Ana Estudiante',
    activeCourses: 3,
    totalProgress: 67,
    achievements: 12,
    studyTime: 24.5,
    streak: 7,
    weeklyGoal: 25,
    currentLevel: 8
  });
  
  const [realTimeData, setRealTimeData] = useState({
    healthStatus: {
      progress: false,
      assessment: false,
      loading: true
    },
    lastActivity: new Date().toISOString()
  });

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
    const interval = setInterval(checkServices, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const progressPercentage = (studentData.studyTime / studentData.weeklyGoal) * 100;
  const isGoalMet = progressPercentage >= 100;

  return (
    <div className="container-professional py-8 animate-fade-in">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: 'Dashboard', active: true }
      ]} />
      
      {/* Search Bar */}
      <div className="mb-8">
        <SearchBar 
          placeholder="Buscar cursos, lecciones, evaluaciones..."
          onSearch={(query) => console.log('Buscando:', query)}
          className="max-w-md"
        />
      </div>
      
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="heading-1 mb-2">
              ¡Bienvenido de vuelta, {studentData.name}! 👋
            </h1>
            <p className="text-body mb-4">
              Continúa tu viaje de aprendizaje. Tienes {studentData.activeCourses} cursos activos 
              y {studentData.achievements} logros desbloqueados.
            </p>
            <div className="flex items-center gap-4">
              <div className="status-success flex items-center gap-2">
                <div className="w-2 h-2 bg-secondary-500 rounded-full animate-pulse"></div>
                <span>Racha de {studentData.streak} días</span>
              </div>
              <div className="status-info flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>Nivel {studentData.currentLevel}</span>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-6 lg:mt-0 flex gap-3">
            <button 
              onClick={() => setCurrentPage('assessment')}
              className="btn-primary flex items-center gap-2"
            >
              <Target className="h-5 w-5" />
              Nueva Evaluación
            </button>
            <button 
              onClick={() => setCurrentPage('diagnostic')}
              className="btn-secondary flex items-center gap-2"
            >
              <Brain className="h-5 w-5" />
              Diagnóstico AI
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid-professional grid-4 mb-8">
        <StatCard
          title="Cursos Activos"
          value={studentData.activeCourses}
          icon={BookOpen}
          subtitle="En progreso"
          color="blue"
          trend={{ value: 15, direction: 'up' }}
        />
        
        <StatCard
          title="Progreso General"
          value={`${studentData.totalProgress}%`}
          icon={TrendingUp}
          subtitle="Promedio de todos los cursos"
          color="green"
          trend={{ value: 8, direction: 'up' }}
        />
        
        <StatCard
          title="Logros Desbloqueados"
          value={studentData.achievements}
          icon={Award}
          subtitle="Este mes"
          color="purple"
          trend={{ value: 12, direction: 'up' }}
        />
        
        <StatCard
          title="Horas esta Semana"
          value={`${studentData.studyTime}h`}
          icon={Clock}
          subtitle={`Meta: ${studentData.weeklyGoal}h`}
          color="orange"
          trend={{ 
            value: Math.round(((studentData.studyTime - 20) / 20) * 100), 
            direction: studentData.studyTime > 20 ? 'up' : 'down' 
          }}
        />
      </div>

      {/* Weekly Goal Progress */}
      <div className="card-professional p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="heading-3 mb-1">Meta Semanal de Estudio</h3>
            <p className="text-body">
              {studentData.studyTime}h de {studentData.weeklyGoal}h completadas
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
            isGoalMet 
              ? 'bg-secondary-100 text-secondary-800' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {isGoalMet ? '✅ Meta Alcanzada' : `${Math.round(progressPercentage)}% Completado`}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              isGoalMet ? 'bg-secondary-500' : 'bg-primary-500'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-small">
          <span>0h</span>
          <span className="font-medium">{studentData.studyTime}h actual</span>
          <span>{studentData.weeklyGoal}h meta</span>
        </div>
      </div>

      {/* System Status */}
      <div className="card-professional p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="heading-3">Estado del Sistema</h3>
          <div className="text-small text-gray-500">
            Última actualización: {new Date().toLocaleTimeString()}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-gray-600" />
              <span className="font-medium">Progress Tracking</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              realTimeData.healthStatus.progress 
                ? 'bg-secondary-100 text-secondary-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {realTimeData.healthStatus.progress ? 'Operativo' : 'Desconectado'}
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-gray-600" />
              <span className="font-medium">Assessment Engine</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              realTimeData.healthStatus.assessment 
                ? 'bg-secondary-100 text-secondary-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {realTimeData.healthStatus.assessment ? 'Operativo' : 'Desconectado'}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Analytics Charts */}
      <div className="grid-professional grid-2 mb-8">
        <ProgressChart 
          type="line" 
          title="Progreso Semanal" 
          height={300}
        />
        <ProgressChart 
          type="bar" 
          title="Horas de Estudio Diarias" 
          height={300}
        />
      </div>
      
      <div className="mb-8">
        <ProgressChart 
          type="pie" 
          title="Distribución por Áreas de Estudio" 
          height={350}
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid-professional grid-3">
        <button 
          onClick={() => setCurrentPage('assessment')}
          className="card-professional p-6 hover:shadow-professional-lg transition-all duration-300 group text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">3</div>
              <div className="text-small text-gray-500">Disponibles</div>
            </div>
          </div>
          <h3 className="heading-3 mb-2">Evaluaciones AI</h3>
          <p className="text-body mb-4">
            Prueba tus conocimientos con evaluaciones adaptativas personalizadas.
          </p>
          <div className="flex items-center text-purple-600 font-medium">
            <span>Comenzar evaluación</span>
            <span className="ml-2">→</span>
          </div>
        </button>
        
        <button 
          onClick={() => setCurrentPage('diagnostic')}
          className="card-professional p-6 hover:shadow-professional-lg transition-all duration-300 group text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition-colors">
              <Brain className="h-8 w-8 text-primary-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">AI</div>
              <div className="text-small text-gray-500">Powered</div>
            </div>
          </div>
          <h3 className="heading-3 mb-2">Diagnóstico Inteligente</h3>
          <p className="text-body mb-4">
            Análisis personalizado de tu progreso y recomendaciones de mejora.
          </p>
          <div className="flex items-center text-primary-600 font-medium">
            <span>Iniciar diagnóstico</span>
            <span className="ml-2">→</span>
          </div>
        </button>
        
        <button 
          onClick={() => setCurrentPage('gamification')}
          className="card-professional p-6 hover:shadow-professional-lg transition-all duration-300 group text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-accent-100 rounded-xl group-hover:bg-accent-200 transition-colors">
              <Trophy className="h-8 w-8 text-accent-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{studentData.currentLevel}</div>
              <div className="text-small text-gray-500">Nivel Actual</div>
            </div>
          </div>
          <h3 className="heading-3 mb-2">Mis Logros</h3>
          <p className="text-body mb-4">
            Revisa tus badges, nivel actual y progreso en el sistema de gamificación.
          </p>
          <div className="flex items-center text-accent-600 font-medium">
            <span>Ver logros</span>
            <span className="ml-2">→</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default DashboardProfessional;