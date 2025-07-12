import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Lightbulb, TrendingUp, Target, Zap, Award } from 'lucide-react';

interface FeedbackProps {
  isCorrect: boolean;
  correctAnswer: any;
  userAnswer: any;
  explanation: string;
  timeSpent: number;
  difficulty: string;
  onNext: () => void;
  showNext: boolean;
  questionType: string;
  points: number;
}

interface FeedbackAnimation {
  show: boolean;
  type: 'correct' | 'incorrect';
  message: string;
}

const InstantFeedback: React.FC<FeedbackProps> = ({
  isCorrect,
  correctAnswer,
  userAnswer,
  explanation,
  timeSpent,
  difficulty,
  onNext,
  showNext,
  questionType,
  points
}) => {
  const [showAnimation, setShowAnimation] = useState<FeedbackAnimation>({
    show: false,
    type: 'correct',
    message: ''
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Trigger feedback animation
    const message = isCorrect ? 
      ['¡Excelente!', '¡Perfecto!', '¡Correcto!', '¡Bien hecho!'][Math.floor(Math.random() * 4)] :
      ['¡Inténtalo de nuevo!', 'No es correcto', 'Sigue practicando', 'Casi ahí'][Math.floor(Math.random() * 4)];
    
    setShowAnimation({
      show: true,
      type: isCorrect ? 'correct' : 'incorrect',
      message
    });

    const timer = setTimeout(() => {
      setShowAnimation(prev => ({ ...prev, show: false }));
      setShowDetails(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isCorrect]);

  const getSpeedFeedback = (time: number) => {
    if (time < 10) return { text: 'Súper rápido', color: 'text-green-600', icon: '⚡' };
    if (time < 30) return { text: 'Buen tiempo', color: 'text-blue-600', icon: '🏃' };
    if (time < 60) return { text: 'Tiempo normal', color: 'text-yellow-600', icon: '⏱️' };
    return { text: 'Tómate tu tiempo', color: 'text-orange-600', icon: '🐌' };
  };

  const getDifficultyBonus = (diff: string) => {
    switch (diff) {
      case 'advanced': return { bonus: 3, text: 'Nivel Avanzado' };
      case 'intermediate': return { bonus: 2, text: 'Nivel Intermedio' };
      default: return { bonus: 1, text: 'Nivel Básico' };
    }
  };

  const speedFeedback = getSpeedFeedback(timeSpent);
  const difficultyBonus = getDifficultyBonus(difficulty);
  const totalPoints = isCorrect ? points * difficultyBonus.bonus : 0;

  // Animation overlay
  if (showAnimation.show) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className={`text-center p-8 rounded-3xl glass-card animate-bounce ${
          showAnimation.type === 'correct' 
            ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300' 
            : 'bg-gradient-to-r from-red-100 to-orange-100 border-red-300'
        }`}>
          <div className="text-6xl mb-4">
            {showAnimation.type === 'correct' ? '✅' : '❌'}
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${
            showAnimation.type === 'correct' ? 'text-green-700' : 'text-red-700'
          }`}>
            {showAnimation.message}
          </h2>
          {isCorrect && (
            <div className="flex items-center justify-center gap-2 text-yellow-600">
              <Award className="h-6 w-6" />
              <span className="text-xl font-bold">+{totalPoints} XP</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!showDetails) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Resultado Principal */}
      <div className={`glass-card rounded-2xl p-6 border-2 ${
        isCorrect 
          ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50' 
          : 'border-red-300 bg-gradient-to-r from-red-50 to-orange-50'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isCorrect ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
            <div>
              <h3 className={`text-xl font-bold ${
                isCorrect ? 'text-green-700' : 'text-red-700'
              }`}>
                {isCorrect ? '¡Respuesta Correcta!' : 'Respuesta Incorrecta'}
              </h3>
              <p className="text-gray-600">
                {isCorrect ? 'Excelente trabajo, sigue así' : 'No te preocupes, aprende del error'}
              </p>
            </div>
          </div>
          
          {isCorrect && (
            <div className="text-center">
              <div className="bg-yellow-100 rounded-full p-3 mb-2">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="text-xl font-bold text-yellow-600">+{totalPoints} XP</p>
              <p className="text-xs text-gray-600">{difficultyBonus.text}</p>
            </div>
          )}
        </div>

        {/* Métricas de Rendimiento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-2 text-blue-600" />
            <p className="text-lg font-bold text-gray-800">{timeSpent}s</p>
            <p className={`text-sm ${speedFeedback.color}`}>
              {speedFeedback.icon} {speedFeedback.text}
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-4 text-center">
            <Target className="h-5 w-5 mx-auto mb-2 text-purple-600" />
            <p className="text-lg font-bold text-gray-800">{difficulty}</p>
            <p className="text-sm text-gray-600">Dificultad</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-2 text-green-600" />
            <p className="text-lg font-bold text-gray-800">{isCorrect ? '100%' : '0%'}</p>
            <p className="text-sm text-gray-600">Precisión</p>
          </div>
        </div>
      </div>

      {/* Análisis de Respuesta */}
      <div className="glass-card rounded-2xl p-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
          Análisis Detallado
        </h4>
        
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Tu respuesta:</p>
            <p className="text-gray-800">
              {questionType === 'multiple_choice' 
                ? `Opción ${String.fromCharCode(65 + userAnswer)}` 
                : userAnswer
              }
            </p>
          </div>
          
          {!isCorrect && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <p className="text-sm font-semibold text-green-700 mb-2">Respuesta correcta:</p>
              <p className="text-green-800">
                {questionType === 'multiple_choice' 
                  ? `Opción ${String.fromCharCode(65 + correctAnswer)}` 
                  : correctAnswer
                }
              </p>
            </div>
          )}
          
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <p className="text-sm font-semibold text-blue-700 mb-2">Explicación:</p>
            <p className="text-blue-800">{explanation}</p>
          </div>
        </div>
      </div>

      {/* Recomendaciones IA */}
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-indigo-600" />
          Recomendación IA Personalizada
        </h4>
        
        <div className="bg-white rounded-xl p-4">
          <p className="text-gray-700">
            {isCorrect ? (
              timeSpent < 15 ? 
                "¡Excelente velocidad y precisión! Considera aumentar la dificultad para un mayor desafío." :
                "Respuesta correcta. Para mejorar tu velocidad, practica problemas similares regularmente."
            ) : (
              difficulty === 'advanced' ?
                "Este es un concepto avanzado. Te recomiendo revisar los fundamentos antes de continuar." :
                "Revisa los materiales del curso relacionados con este tema y vuelve a intentarlo."
            )}
          </p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-4">
        {showNext && (
          <button 
            onClick={onNext}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            {isCorrect ? 'Siguiente Pregunta' : 'Intentar Otra Vez'} →
          </button>
        )}
        
        <button className="glass px-6 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200">
          📚 Estudiar Tema
        </button>
      </div>
    </div>
  );
};

export default InstantFeedback;