import React, { useState, useEffect } from 'react';
import { Brain, Users, Target, TrendingUp, BookOpen, Lightbulb, Heart, Zap } from 'lucide-react';

interface LearningPath {
  id: string;
  name: string;
  description: string;
  adaptiveFeatures: string[];
  personalizedContent: boolean;
  collaborativeLearning: boolean;
  progress: number;
}

interface EducationalDesignProps {
  studentId: string;
}

const EducationalDesignPrinciples: React.FC<EducationalDesignProps> = ({ studentId }) => {
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [activeStrategies, setActiveStrategies] = useState<string[]>([]);
  const [adaptiveInsights, setAdaptiveInsights] = useState<string[]>([]);

  useEffect(() => {
    initializeEducationalDesign();
  }, [studentId]);

  const initializeEducationalDesign = () => {
    // Implementar principios educativos basados en el estudio proporcionado
    const paths: LearningPath[] = [
      {
        id: 'adaptive_personalization',
        name: 'Personalización Adaptativa',
        description: 'Contenido ajustado automáticamente según tu estilo de aprendizaje',
        adaptiveFeatures: ['Análisis de patrones', 'Ajuste de dificultad', 'Recomendaciones IA'],
        personalizedContent: true,
        collaborativeLearning: false,
        progress: 85
      },
      {
        id: 'collaborative_learning',
        name: 'Aprendizaje Colaborativo',
        description: 'Interacción con pares para construcción social del conocimiento',
        adaptiveFeatures: ['Grupos inteligentes', 'Peer tutoring', 'Proyectos colaborativos'],
        personalizedContent: false,
        collaborativeLearning: true,
        progress: 67
      },
      {
        id: 'metacognitive_support',
        name: 'Soporte Metacognitivo',
        description: 'Desarrollo de habilidades de autorreflexión y autorregulación',
        adaptiveFeatures: ['Auto-evaluación', 'Reflexión guiada', 'Estrategias de estudio'],
        personalizedContent: true,
        collaborativeLearning: false,
        progress: 72
      },
      {
        id: 'zone_proximal_development',
        name: 'Zona de Desarrollo Próximo',
        description: 'Desafíos calibrados para maximizar el aprendizaje',
        adaptiveFeatures: ['Scaffolding dinámico', 'Dificultad adaptativa', 'Apoyo contextual'],
        personalizedContent: true,
        collaborativeLearning: true,
        progress: 90
      }
    ];

    setLearningPaths(paths);
    
    setActiveStrategies([
      'Microlearning con sesiones de 15-20 minutos',
      'Feedback inmediato y constructivo',
      'Gamificación educativa con propósito pedagógico',
      'Aprendizaje basado en problemas reales',
      'Evaluación formativa continua'
    ]);

    setAdaptiveInsights([
      'Tu patrón de aprendizaje prefiere contenido visual y práctico',
      'Mejor rendimiento en sesiones matutinas (9-11 AM)',
      'Necesitas más tiempo en conceptos abstractos complejos',
      'Excelente progreso en aprendizaje colaborativo',
      'Recomendamos alternar teoría con aplicación práctica'
    ]);
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.includes('IA') || feature.includes('inteligente')) return <Brain className="h-4 w-4" />;
    if (feature.includes('colaborativ') || feature.includes('grupo')) return <Users className="h-4 w-4" />;
    if (feature.includes('adaptativ') || feature.includes('dificultad')) return <Target className="h-4 w-4" />;
    return <Lightbulb className="h-4 w-4" />;
  };

  return (
    <div className="space-y-8">
      {/* Header Principios Educativos */}
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="text-center mb-6">
          <div className="inline-block p-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 mb-4">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Principios de Diseño Educativo Aplicados
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Sistema basado en investigación pedagógica avanzada para optimizar tu experiencia de aprendizaje
          </p>
        </div>

        {/* Métricas de Efectividad */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="p-2 bg-blue-100 rounded-lg mx-auto w-fit mb-2">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-xl font-bold text-gray-800">94%</p>
            <p className="text-sm text-gray-600">Personalización</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="p-2 bg-green-100 rounded-lg mx-auto w-fit mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-xl font-bold text-gray-800">87%</p>
            <p className="text-sm text-gray-600">Retención</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="p-2 bg-purple-100 rounded-lg mx-auto w-fit mb-2">
              <Heart className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-xl font-bold text-gray-800">91%</p>
            <p className="text-sm text-gray-600">Engagement</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="p-2 bg-yellow-100 rounded-lg mx-auto w-fit mb-2">
              <Zap className="h-5 w-5 text-yellow-600" />
            </div>
            <p className="text-xl font-bold text-gray-800">89%</p>
            <p className="text-sm text-gray-600">Efectividad</p>
          </div>
        </div>
      </div>

      {/* Rutas de Aprendizaje Adaptativo */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
          Rutas de Aprendizaje Adaptativo Activas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {learningPaths.map((path) => (
            <div key={path.id} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">{path.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{path.description}</p>
                </div>
                <div className="text-right">
                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                    {path.progress}%
                  </div>
                </div>
              </div>
              
              {/* Barra de progreso */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000"
                  style={{ width: `${path.progress}%` }}
                ></div>
              </div>
              
              {/* Características adaptativas */}
              <div className="space-y-2">
                {path.adaptiveFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="p-1 bg-blue-100 rounded text-blue-600">
                      {getFeatureIcon(feature)}
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              
              {/* Badges de características */}
              <div className="flex gap-2 mt-4">
                {path.personalizedContent && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                    🎯 Personalizado
                  </span>
                )}
                {path.collaborativeLearning && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold">
                    👥 Colaborativo
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estrategias Pedagógicas Activas */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
          Estrategias Pedagógicas en Aplicación
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeStrategies.map((strategy, index) => (
            <div key={index} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <span className="text-lg">📚</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{strategy}</p>
                  <div className="mt-2">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                      ✅ Activa
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights Adaptativos Personalizados */}
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-green-50 to-teal-50">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-green-600" />
          Insights Adaptativos Personalizados
        </h3>
        
        <div className="space-y-4">
          {adaptiveInsights.map((insight, index) => (
            <div key={index} className="bg-white rounded-xl p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-lg">🧠</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">{insight}</p>
                  <div className="mt-2 flex gap-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                      IA Personalizada
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                      Basado en datos
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl border border-indigo-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <span className="text-lg">🎯</span>
            </div>
            <h4 className="font-bold text-gray-800">Recomendación Pedagógica Principal</h4>
          </div>
          <p className="text-gray-700 ml-11">
            Basado en tu perfil de aprendizaje, recomendamos implementar <strong>sesiones de práctica espaciada</strong> 
            combinadas con <strong>reflexión metacognitiva</strong> para optimizar la retención a largo plazo.
          </p>
        </div>
      </div>

      {/* Métricas de Efectividad Pedagógica */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          Efectividad de Principios Educativos
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Teorías Aplicadas</h4>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Constructivismo Social</span>
                <span className="text-sm text-green-600 font-bold">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 bg-green-500 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Aprendizaje Adaptativo</span>
                <span className="text-sm text-blue-600 font-bold">88%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Metacognición</span>
                <span className="text-sm text-purple-600 font-bold">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 bg-purple-500 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Impacto en Aprendizaje</h4>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 mb-1">+34%</p>
                <p className="text-sm text-gray-600">Mejora en retención</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 border border-green-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 mb-1">+28%</p>
                <p className="text-sm text-gray-600">Velocidad de aprendizaje</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600 mb-1">+41%</p>
                <p className="text-sm text-gray-600">Satisfacción estudiantil</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationalDesignPrinciples;