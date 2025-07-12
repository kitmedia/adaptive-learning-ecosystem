import React from 'react';
import { Trophy, Crown, Star, Zap } from 'lucide-react';
import GamificationSystem from '../components/GamificationSystem';

const GamificationPage: React.FC = () => {
  const studentId = '550e8400-e29b-41d4-a716-446655440003'; // Student ID fijo para demo

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-block p-4 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 mb-6">
          <Crown className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          🏆 Centro de Logros y Gamificación
        </h1>
        <p className="text-xl text-blue-100 max-w-2xl mx-auto">
          Desbloquea badges, gana experiencia y celebra tus logros académicos
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200">
          <div className="flex items-center justify-between mb-3">
            <Trophy className="h-8 w-8 text-yellow-600" />
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
              TOTAL
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-1">847</p>
          <p className="text-sm text-gray-600">Puntos de Experiencia</p>
        </div>

        <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <Star className="h-8 w-8 text-blue-600" />
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
              BADGES
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-1">12</p>
          <p className="text-sm text-gray-600">Badges Desbloqueados</p>
        </div>

        <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <Crown className="h-8 w-8 text-purple-600" />
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold">
              NIVEL
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-1">8</p>
          <p className="text-sm text-gray-600">Nivel Actual</p>
        </div>

        <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-green-50 to-teal-50 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <Zap className="h-8 w-8 text-green-600" />
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
              RACHA
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-1">7</p>
          <p className="text-sm text-gray-600">Días Consecutivos</p>
        </div>
      </div>

      {/* Gamification System */}
      <GamificationSystem studentId={studentId} />

      {/* Quick Actions */}
      <div className="mt-8 glass-card rounded-2xl p-8 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center mb-6">
          <div className="inline-block p-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 mb-4">
            <span className="text-2xl text-white">⚡</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Acciones para Ganar XP</h2>
          <p className="text-gray-600">Completa estas actividades para ganar más experiencia</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-6 rounded-2xl hover:scale-105 transition-all duration-300 group bg-white">
            <div className="p-3 bg-blue-100 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <span className="text-2xl">📚</span>
            </div>
            <span className="block font-semibold text-gray-800 text-lg">Completar Lección</span>
            <p className="text-sm text-gray-600 mt-2 mb-3">Gana 10 XP por cada lección</p>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold text-center">
              +10 XP
            </div>
          </div>
          
          <div className="glass p-6 rounded-2xl hover:scale-105 transition-all duration-300 group bg-white">
            <div className="p-3 bg-green-100 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <span className="text-2xl">🎯</span>
            </div>
            <span className="block font-semibold text-gray-800 text-lg">Evaluación Perfecta</span>
            <p className="text-sm text-gray-600 mt-2 mb-3">Obtén 100% en una evaluación</p>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold text-center">
              +50 XP
            </div>
          </div>
          
          <div className="glass p-6 rounded-2xl hover:scale-105 transition-all duration-300 group bg-white">
            <div className="p-3 bg-purple-100 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
              <span className="text-2xl">🔥</span>
            </div>
            <span className="block font-semibold text-gray-800 text-lg">Mantener Racha</span>
            <p className="text-sm text-gray-600 mt-2 mb-3">Estudia todos los días</p>
            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold text-center">
              +25 XP/día
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Preview */}
      <div className="mt-8 glass-card rounded-2xl p-8">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">🏅 Tabla de Clasificación</h3>
          <p className="text-gray-600">¿Cómo te comparas con otros estudiantes?</p>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🥇</span>
              <div>
                <p className="font-semibold text-gray-800">Carlos Estudiante</p>
                <p className="text-sm text-gray-600">Nivel 12 • 1,234 XP</p>
              </div>
            </div>
            <div className="text-right">
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                #1
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🥈</span>
              <div>
                <p className="font-semibold text-gray-800">María López</p>
                <p className="text-sm text-gray-600">Nivel 10 • 987 XP</p>
              </div>
            </div>
            <div className="text-right">
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                #2
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🥉</span>
              <div>
                <p className="font-semibold text-gray-800">Tú (Ana Estudiante)</p>
                <p className="text-sm text-gray-600">Nivel 8 • 847 XP</p>
              </div>
            </div>
            <div className="text-right">
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                #3
              </span>
            </div>
          </div>
        </div>
        
        <button className="mt-6 w-full btn-primary">
          🏆 Ver Clasificación Completa
        </button>
      </div>
    </div>
  );
};

export default GamificationPage;