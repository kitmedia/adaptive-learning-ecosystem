import React, { useState } from 'react';
import { Brain, Target, Clock, Award, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { apiService } from '../services/api.service';
import InstantFeedback from '../components/InstantFeedback';

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options?: string[];
  correct_answer: any;
  difficulty_level: string;
  topic: string;
  learning_objective: string;
  max_points: number;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  course_id: string;
  questions: Question[];
  total_points: number;
  time_limit_minutes?: number;
  difficulty_level: string;
  assessment_type: string;
}

interface Answer {
  question_id: string;
  student_answer: any;
  time_taken_seconds: number;
  is_correct?: boolean;
  points_earned?: number;
}

interface AssessmentResult {
  submission_id: string;
  total_score: number;
  percentage_score: number;
  passed: boolean;
  feedback: string;
  recommendations: string[];
  detailed_results: Answer[];
}

const AssessmentPage: React.FC = () => {
  const [currentState, setCurrentState] = useState<'selection' | 'taking' | 'results'>('selection');
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [assessmentStartTime, setAssessmentStartTime] = useState<Date>(new Date());
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<any>(null);

  const studentId = '550e8400-e29b-41d4-a716-446655440003'; // Student ID fijo para demo

  const generateAssessment = async (courseId: string, difficulty: string, numQuestions: number) => {
    setLoading(true);
    try {
      const response = await apiService.generateAssessment({
        course_id: courseId,
        difficulty_level: difficulty,
        num_questions: numQuestions,
        assessment_type: 'practice'
      });

      if (response.data && response.data.assessment) {
        setAssessment(response.data.assessment);
        setCurrentState('taking');
        setCurrentQuestionIndex(0);
        setAnswers([]);
        setStartTime(Date.now());
        setAssessmentStartTime(new Date());
      }
    } catch (error) {
      console.error('Error generating assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: any) => {
    if (!assessment) return;

    const currentQuestion = assessment.questions[currentQuestionIndex];
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    
    // Verificar respuesta
    const isCorrect = currentQuestion.question_type === 'multiple_choice' 
      ? answer === currentQuestion.correct_answer
      : answer.toLowerCase().includes(currentQuestion.correct_answer.toLowerCase());

    const newAnswer: Answer = {
      question_id: currentQuestion.id,
      student_answer: answer,
      time_taken_seconds: timeSpent,
      is_correct: isCorrect,
      points_earned: isCorrect ? currentQuestion.max_points : 0
    };

    // Mostrar feedback inmediato
    setCurrentFeedback({
      isCorrect,
      correctAnswer: currentQuestion.correct_answer,
      userAnswer: answer,
      explanation: `Esta pregunta evalúa ${currentQuestion.learning_objective}. ${isCorrect ? 'Has demostrado una comprensión excelente del concepto.' : 'Te recomendamos revisar este tema para fortalecer tu comprensión.'}`,
      timeSpent,
      difficulty: currentQuestion.difficulty_level,
      questionType: currentQuestion.question_type,
      points: currentQuestion.max_points
    });
    setShowFeedback(true);

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    setCurrentFeedback(null);
    
    if (currentQuestionIndex < assessment!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setStartTime(Date.now());
    } else {
      // Enviar assessment completo
      submitAssessment(answers);
    }
  };

  const submitAssessment = async (finalAnswers: Answer[]) => {
    if (!assessment) return;

    setLoading(true);
    try {
      const totalTime = Math.round((Date.now() - assessmentStartTime.getTime()) / 1000);
      
      const submission = {
        student_id: studentId,
        assessment_id: assessment.id,
        answers: finalAnswers,
        started_at: assessmentStartTime.toISOString(),
        total_time_seconds: totalTime
      };

      const response = await apiService.submitAssessment(assessment.id, submission);
      
      if (response.data && response.data.result) {
        setResult(response.data.result);
        setCurrentState('results');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetAssessment = () => {
    setCurrentState('selection');
    setAssessment(null);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setResult(null);
  };

  if (currentState === 'selection') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-4 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 mb-6">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Centro de Evaluaciones AI</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Genera evaluaciones adaptativas personalizadas para medir y mejorar tu aprendizaje
          </p>
        </div>

        {/* Assessment Generation Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            className="glass-card rounded-2xl p-8 hover:scale-105 transition-all duration-300 cursor-pointer group"
            onClick={() => generateAssessment('intro_ai', 'beginner', 3)}
          >
            <div className="text-center">
              <div className="p-4 bg-green-100 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Evaluación Básica</h3>
              <p className="text-gray-600 mb-4">3 preguntas de nivel principiante</p>
              <div className="flex justify-center gap-2 text-sm text-gray-500">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">Principiante</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">5-10 min</span>
              </div>
            </div>
          </div>

          <div 
            className="glass-card rounded-2xl p-8 hover:scale-105 transition-all duration-300 cursor-pointer group"
            onClick={() => generateAssessment('intro_ai', 'intermediate', 5)}
          >
            <div className="text-center">
              <div className="p-4 bg-yellow-100 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-yellow-200 transition-colors">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Evaluación Intermedia</h3>
              <p className="text-gray-600 mb-4">5 preguntas de nivel intermedio</p>
              <div className="flex justify-center gap-2 text-sm text-gray-500">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Intermedio</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">10-15 min</span>
              </div>
            </div>
          </div>

          <div 
            className="glass-card rounded-2xl p-8 hover:scale-105 transition-all duration-300 cursor-pointer group"
            onClick={() => generateAssessment('intro_ai', 'advanced', 7)}
          >
            <div className="text-center">
              <div className="p-4 bg-red-100 rounded-2xl w-fit mx-auto mb-4 group-hover:bg-red-200 transition-colors">
                <Award className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Evaluación Avanzada</h3>
              <p className="text-gray-600 mb-4">7 preguntas de nivel avanzado</p>
              <div className="flex justify-center gap-2 text-sm text-gray-500">
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full">Avanzado</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">15-20 min</span>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-block p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
            <p className="text-white font-semibold">Generando evaluación adaptativa...</p>
          </div>
        )}
      </div>
    );
  }

  if (currentState === 'taking' && assessment) {
    const currentQuestion = assessment.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Progress Header */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">{assessment.title}</h2>
            <span className="text-sm text-gray-600">
              Pregunta {currentQuestionIndex + 1} de {assessment.questions.length}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>{Math.round(progress)}% completado</span>
            <span className="flex items-center">
              <Target className="h-4 w-4 mr-1" />
              {currentQuestion.topic}
            </span>
          </div>
        </div>

        {!showFeedback && (
          <>
            {/* Question */}
            <div className="glass-card rounded-2xl p-8 mb-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6 leading-relaxed">
                {currentQuestion.question_text}
              </h3>

              {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
                <div className="space-y-4">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      className="w-full glass p-4 rounded-xl text-left hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 group"
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
              )}

              {currentQuestion.question_type === 'short_answer' && (
                <div className="space-y-4">
                  <textarea
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    rows={4}
                    placeholder="Escribe tu respuesta aquí..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        const target = e.target as HTMLTextAreaElement;
                        if (target.value.trim()) {
                          handleAnswer(target.value.trim());
                        }
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const textarea = e.currentTarget.previousElementSibling as HTMLTextAreaElement;
                      if (textarea.value.trim()) {
                        handleAnswer(textarea.value.trim());
                      }
                    }}
                    className="btn-primary"
                  >
                    Siguiente Pregunta →
                  </button>
                </div>
              )}
            </div>

            {/* Question Info */}
            <div className="text-center text-sm text-gray-500">
              <div className="flex items-center justify-center gap-4">
                <span>🎯 {currentQuestion.learning_objective}</span>
                <span>📊 {currentQuestion.max_points} puntos</span>
                <span>⏱️ Nivel {currentQuestion.difficulty_level}</span>
              </div>
            </div>
          </>
        )}

        {/* Instant Feedback */}
        {showFeedback && currentFeedback && (
          <InstantFeedback
            {...currentFeedback}
            onNext={handleNextQuestion}
            showNext={true}
          />
        )}

      </div>
    );
  }

  if (currentState === 'results' && result) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Results Header */}
        <div className="text-center mb-8">
          <div className={`inline-block p-4 rounded-full mb-6 ${
            result.passed 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
              : 'bg-gradient-to-r from-orange-500 to-red-600'
          }`}>
            {result.passed ? (
              <CheckCircle className="h-8 w-8 text-white" />
            ) : (
              <XCircle className="h-8 w-8 text-white" />
            )}
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            {result.passed ? '¡Excelente trabajo!' : '¡Sigue practicando!'}
          </h1>
          <p className="text-xl text-blue-100">
            Has obtenido {result.percentage_score.toFixed(1)}% en la evaluación
          </p>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-3xl font-bold text-gray-800">{result.percentage_score.toFixed(1)}%</p>
            <p className="text-sm text-gray-600 mt-1">Puntuación Final</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-3xl font-bold text-gray-800">{result.total_score.toFixed(1)}</p>
            <p className="text-sm text-gray-600 mt-1">Puntos Obtenidos</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className={`text-3xl font-bold ${result.passed ? 'text-green-600' : 'text-orange-600'}`}>
              {result.passed ? 'APROBADO' : 'REPROBADO'}
            </p>
            <p className="text-sm text-gray-600 mt-1">Estado</p>
          </div>
        </div>

        {/* Feedback */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Lightbulb className="h-6 w-6 mr-2 text-yellow-500" />
            Feedback Personalizado
          </h3>
          <p className="text-gray-700 leading-relaxed">{result.feedback}</p>
        </div>

        {/* Recommendations */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 Recomendaciones para Mejorar</h3>
          <ul className="space-y-3">
            {result.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={resetAssessment}
            className="btn-primary"
          >
            Nueva Evaluación
          </button>
          <button
            onClick={() => window.location.reload()}
            className="glass px-6 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default AssessmentPage;