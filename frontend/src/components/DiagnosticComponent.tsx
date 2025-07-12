import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.service';

interface DiagnosticQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: string[];
  learning_dimension: string;
  weight: number;
}

interface DiagnosticResponse {
  question_id: string;
  selected_option: number;
  response_time_seconds: number;
}

interface DiagnosticComponentProps {
  studentId: string;
  onCompleted?: (profile: any) => void;
}

const DiagnosticComponent: React.FC<DiagnosticComponentProps> = ({
  studentId,
  onCompleted
}) => {
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<DiagnosticResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [completed, setCompleted] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const generateDiagnostic = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.generateDiagnostic(studentId);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setQuestions(response.data.assessment || []);
      setStartTime(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando diagnóstico');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    generateDiagnostic();
  }, [generateDiagnostic]);

  const handleAnswerSelect = (optionIndex: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    const responseTime = Math.round((Date.now() - startTime) / 1000);

    const newResponse: DiagnosticResponse = {
      question_id: currentQuestion.id,
      selected_option: optionIndex,
      response_time_seconds: responseTime,
    };

    const newResponses = [...responses, newResponse];
    setResponses(newResponses);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setStartTime(Date.now());
    } else {
      // Completado - analizar respuestas
      analyzeDiagnostic(newResponses);
    }
  };

  const analyzeDiagnostic = async (finalResponses: DiagnosticResponse[]) => {
    setLoading(true);

    try {
      const response = await apiService.analyzeDiagnostic(studentId, finalResponses);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setProfile(response.data.profile);
      setCompleted(true);
      
      if (onCompleted) {
        onCompleted(response.data.profile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error analizando diagnóstico');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="inline-block p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
            <div className="spinner border-white"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">🧠 Procesando diagnóstico...</h3>
          <p className="text-gray-600">Nuestro AI está analizando tus respuestas</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-8 max-w-2xl mx-auto border-red-200">
        <div className="text-center">
          <div className="inline-block p-4 rounded-full bg-red-100 mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold text-red-800 mb-2">Error en el Diagnóstico</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={generateDiagnostic}
            className="btn-primary bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
          >
            🔄 Reintentar Diagnóstico
          </button>
        </div>
      </div>
    );
  }

  if (completed && profile) {
    return (
      <div className="glass-card rounded-2xl p-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-gradient-to-r from-green-400 to-blue-500 mb-4">
            <span className="text-3xl text-white">🎉</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Diagnóstico Completado</h3>
          <p className="text-gray-600">Tu perfil de aprendizaje personalizado está listo</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
          <h4 className="text-xl font-bold text-gray-800 mb-6 text-center">🧠 Tu Perfil de Aprendizaje AI</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass p-4 rounded-xl">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">🎯</span>
                <strong className="text-gray-800">Estilo de Aprendizaje:</strong>
              </div>
              <p className="text-gray-700 ml-11">{profile.learning_style}</p>
              <div className="ml-11 mt-1">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                      style={{ width: `${Math.round(profile.confidence * 100)}%` }}
                    ></div>
                  </div>
                  <span>{Math.round(profile.confidence * 100)}%</span>
                </div>
              </div>
            </div>
            
            <div className="glass p-4 rounded-xl">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">⚡</span>
                <strong className="text-gray-800">Ritmo Preferido:</strong>
              </div>
              <p className="text-gray-700 ml-11">{profile.preferred_pace}</p>
            </div>
            
            <div className="glass p-4 rounded-xl">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">📊</span>
                <strong className="text-gray-800">Nivel de Dificultad:</strong>
              </div>
              <p className="text-gray-700 ml-11">{profile.difficulty_level}</p>
            </div>
            
            <div className="glass p-4 rounded-xl">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">⏱️</span>
                <strong className="text-gray-800">Span de Atención:</strong>
              </div>
              <p className="text-gray-700 ml-11">{profile.attention_span} minutos</p>
            </div>
            
            {profile.interests?.length > 0 && (
              <div className="glass p-4 rounded-xl md:col-span-2">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-3">💡</span>
                  <strong className="text-gray-800">Intereses:</strong>
                </div>
                <div className="ml-11 flex flex-wrap gap-2">
                  {profile.interests.map((interest: string, index: number) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {profile.strengths?.length > 0 && (
              <div className="glass p-4 rounded-xl md:col-span-2">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-3">💪</span>
                  <strong className="text-gray-800">Fortalezas:</strong>
                </div>
                <div className="ml-11 flex flex-wrap gap-2">
                  {profile.strengths.map((strength: string, index: number) => (
                    <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-center">
          <button 
            onClick={() => setCompleted(false)}
            className="btn-primary"
          >
            🔄 Realizar Nuevo Diagnóstico
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 max-w-2xl mx-auto text-center">
        <div className="mb-6">
          <span className="text-6xl mb-4 block">🤔</span>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay preguntas disponibles</h3>
          <p className="text-gray-600">Vamos a generar tu diagnóstico personalizado</p>
        </div>
        <button 
          onClick={generateDiagnostic}
          className="btn-primary"
        >
          🎯 Generar Diagnóstico AI
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="glass-card rounded-2xl p-8 max-w-3xl mx-auto">
      {/* Header with Progress */}
      <div className="text-center mb-8">
        <div className="inline-block p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
          <span className="text-2xl text-white">🧠</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Diagnóstico de Aprendizaje AI</h3>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-600">
          <span>Pregunta {currentQuestionIndex + 1} de {questions.length}</span>
          <span>{Math.round(progress)}% completado</span>
        </div>
      </div>

      {/* Question Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
          <h4 className="text-xl font-semibold text-gray-800 leading-relaxed">
            {currentQuestion.question_text}
          </h4>
        </div>
        
        <div className="grid gap-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className="glass p-4 rounded-xl text-left transition-all duration-300 hover:bg-blue-50 hover:border-blue-300 hover:shadow-lg hover:scale-[1.02] group"
              onClick={() => handleAnswerSelect(index)}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-center font-semibold mr-4 group-hover:scale-110 transition-transform">
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="text-gray-700 font-medium group-hover:text-gray-900">
                  {option}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="text-center pt-4 border-t border-gray-200">
        <div className="inline-flex items-center text-sm text-gray-500">
          <span className="mr-2">🎯</span>
          <span>Dimensión: <strong>{currentQuestion.learning_dimension}</strong></span>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticComponent;