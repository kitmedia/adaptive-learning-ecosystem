import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Star, Award, Crown, Medal } from 'lucide-react';
import { apiService } from '../services/api.service';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned: boolean;
  earnedDate?: string;
  progress?: number;
  maxProgress?: number;
  category: 'learning' | 'streak' | 'speed' | 'completion' | 'excellence';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  unlocked: boolean;
  unlockedDate?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  type: 'milestone' | 'challenge' | 'special';
}

interface GamificationProps {
  studentId: string;
  compact?: boolean;
}

const GamificationSystem: React.FC<GamificationProps> = ({ studentId, compact = false }) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [xpProgress, setXpProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  const initializeGamification = useCallback(async () => {
    try {
      const response = await apiService.getStudentProgressSummary(studentId);
      
      if (response.data) {
        const summary = response.data.global_summary || {};
        const courses = response.data.courses || [];
        
        // Calcular puntos y nivel
        const points = calculateTotalPoints(summary, courses);
        const calculatedLevel = Math.floor(points / 100) + 1;
        const xp = points % 100;
        
        setTotalPoints(points);
        setLevel(calculatedLevel);
        setXpProgress(xp);
        
        // Generar badges basados en progreso real
        const generatedBadges = generateBadges(summary, courses);
        setBadges(generatedBadges);
        
        // Generar logros
        const generatedAchievements = generateAchievements(summary, courses, points);
        setAchievements(generatedAchievements);
      }
    } catch (error) {
      console.error('Error initializing gamification:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    initializeGamification();
  }, [initializeGamification]);

  const calculateTotalPoints = (summary: any, courses: any[]) => {
    let points = 0;
    
    // Puntos por lecciones completadas
    courses.forEach(course => {
      points += (course.completed_lessons || 0) * 10;
    });
    
    // Puntos por puntuación media
    points += Math.round((summary.overall_avg_score || 0) * 2);
    
    // Puntos por tiempo dedicado (1 punto por hora)
    points += Math.floor((summary.total_time || 0) / 3600);
    
    return points;
  };

  const generateBadges = (summary: any, courses: any[]): Badge[] => {
    const totalLessons = courses.reduce((acc, course) => acc + (course.completed_lessons || 0), 0);
    const avgScore = summary.overall_avg_score || 0;
    const totalTime = summary.total_time || 0;
    
    return [
      {
        id: 'first_lesson',
        name: 'Primer Paso',
        description: 'Completa tu primera lección',
        icon: '🌟',
        rarity: 'common',
        earned: totalLessons >= 1,
        category: 'learning',
        earnedDate: totalLessons >= 1 ? new Date().toISOString() : undefined
      },
      {
        id: 'fast_learner',
        name: 'Aprendiz Rápido',
        description: 'Completa 5 lecciones en una semana',
        icon: '⚡',
        rarity: 'rare',
        earned: totalLessons >= 5,
        category: 'speed',
        earnedDate: totalLessons >= 5 ? new Date().toISOString() : undefined
      },
      {
        id: 'perfectionist',
        name: 'Perfeccionista',
        description: 'Obtén una puntuación media superior al 90%',
        icon: '💎',
        rarity: 'epic',
        earned: avgScore >= 90,
        category: 'excellence',
        earnedDate: avgScore >= 90 ? new Date().toISOString() : undefined
      },
      {
        id: 'dedicated_student',
        name: 'Estudiante Dedicado',
        description: 'Dedica más de 10 horas al estudio',
        icon: '📚',
        rarity: 'rare',
        earned: totalTime >= 36000, // 10 horas
        category: 'learning',
        progress: Math.min(totalTime / 3600, 10),
        maxProgress: 10,
        earnedDate: totalTime >= 36000 ? new Date().toISOString() : undefined
      },
      {
        id: 'streak_master',
        name: 'Maestro de Rachas',
        description: 'Mantén una racha de 7 días',
        icon: '🔥',
        rarity: 'epic',
        earned: true, // Simulado
        category: 'streak',
        earnedDate: new Date().toISOString()
      },
      {
        id: 'course_champion',
        name: 'Campeón del Curso',
        description: 'Completa un curso completo',
        icon: '🏆',
        rarity: 'legendary',
        earned: false,
        category: 'completion',
        progress: Math.max(...courses.map(c => (c.completed_lessons || 0) / (c.total_lessons || 1))),
        maxProgress: 1
      }
    ];
  };

  const generateAchievements = (_summary: any, courses: any[], points: number): Achievement[] => {
    const totalLessons = courses.reduce((acc, course) => acc + (course.completed_lessons || 0), 0);
    
    return [
      {
        id: 'bronze_learner',
        title: 'Estudiante de Bronce',
        description: 'Alcanza 100 puntos de experiencia',
        points: 100,
        unlocked: points >= 100,
        tier: 'bronze',
        type: 'milestone',
        unlockedDate: points >= 100 ? new Date().toISOString() : undefined
      },
      {
        id: 'silver_scholar',
        title: 'Académico de Plata',
        description: 'Alcanza 500 puntos de experiencia',
        points: 500,
        unlocked: points >= 500,
        tier: 'silver',
        type: 'milestone',
        unlockedDate: points >= 500 ? new Date().toISOString() : undefined
      },
      {
        id: 'lesson_marathon',
        title: 'Maratón de Lecciones',
        description: 'Completa 20 lecciones',
        points: 200,
        unlocked: totalLessons >= 20,
        tier: 'gold',
        type: 'challenge',
        unlockedDate: totalLessons >= 20 ? new Date().toISOString() : undefined
      },
      {
        id: 'ai_master',
        title: 'Maestro de IA',
        description: 'Domina los conceptos de Inteligencia Artificial',
        points: 1000,
        unlocked: false,
        tier: 'platinum',
        type: 'special'
      }
    ];
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return <Medal className="h-5 w-5 text-orange-600" />;
      case 'silver': return <Award className="h-5 w-5 text-gray-500" />;
      case 'gold': return <Trophy className="h-5 w-5 text-yellow-600" />;
      case 'platinum': return <Crown className="h-5 w-5 text-purple-600" />;
      default: return <Star className="h-5 w-5 text-gray-400" />;
    }
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-300 rounded-xl"></div>
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
            <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
            Gamificación
          </h3>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">Nivel {level}</p>
            <p className="text-xs text-gray-600">{totalPoints} XP</p>
          </div>
        </div>
        
        {/* Barra de XP */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all duration-1000"
              style={{ width: `${xpProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Nivel {level}</span>
            <span>{xpProgress}/100 XP</span>
            <span>Nivel {level + 1}</span>
          </div>
        </div>

        {/* Badges recientes */}
        <div className="grid grid-cols-4 gap-2">
          {badges.filter(b => b.earned).slice(0, 4).map((badge) => (
            <div
              key={badge.id}
              className={`p-2 rounded-xl text-center border-2 ${getRarityColor(badge.rarity)} hover:scale-105 transition-transform`}
              title={badge.name}
            >
              <span className="text-lg">{badge.icon}</span>
              <p className="text-xs font-semibold text-gray-700 mt-1 truncate">{badge.name}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de Gamificación */}
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-yellow-50 to-orange-50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <Crown className="h-6 w-6 mr-2 text-yellow-600" />
              Sistema de Gamificación
            </h2>
            <p className="text-gray-600">Desbloquea logros y gana experiencia</p>
          </div>
          <div className="text-center">
            <div className="bg-yellow-100 rounded-full p-4 mb-2">
              <span className="text-3xl font-bold text-yellow-600">Nv. {level}</span>
            </div>
            <p className="text-sm font-semibold text-gray-700">{totalPoints} XP Total</p>
          </div>
        </div>

        {/* Barra de Progreso de Nivel */}
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className="h-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all duration-1000 relative"
              style={{ width: `${xpProgress}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-700 mt-2">
            <span>Nivel {level}</span>
            <span className="font-semibold">{xpProgress}/100 XP hasta nivel {level + 1}</span>
            <span>Nivel {level + 1}</span>
          </div>
        </div>
      </div>

      {/* Badges System */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <Star className="h-5 w-5 mr-2 text-blue-600" />
            Colección de Badges
          </h3>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
            {badges.filter(b => b.earned).length}/{badges.length} desbloqueados
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl text-center border-2 transition-all duration-300 ${
                badge.earned 
                  ? `${getRarityColor(badge.rarity)} hover:scale-105 shadow-lg` 
                  : 'border-gray-200 bg-gray-50 opacity-50'
              }`}
            >
              <div className="text-3xl mb-2">{badge.icon}</div>
              <h4 className="font-semibold text-gray-800 text-sm mb-1">{badge.name}</h4>
              <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
              
              {badge.progress !== undefined && badge.maxProgress && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
                  ></div>
                </div>
              )}
              
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                badge.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                badge.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                badge.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {badge.rarity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements System */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
            Logros y Desafíos
          </h3>
          <button 
            onClick={triggerCelebration}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
          >
            🎉 Celebrar
          </button>
        </div>

        <div className="space-y-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                achievement.unlocked 
                  ? 'border-green-300 bg-green-50 hover:scale-[1.02]' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-white">
                    {getTierIcon(achievement.tier)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{achievement.title}</h4>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    {achievement.unlockedDate && (
                      <p className="text-xs text-green-600 mt-1">
                        Desbloqueado el {new Date(achievement.unlockedDate).toLocaleDateString('es-ES')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold mb-2 ${
                    achievement.unlocked ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {achievement.unlocked ? 'Desbloqueado' : 'Bloqueado'}
                  </div>
                  <p className="text-lg font-bold text-yellow-600">+{achievement.points} XP</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl animate-bounce">
            🎉🏆✨
          </div>
        </div>
      )}
    </div>
  );
};

export default GamificationSystem;