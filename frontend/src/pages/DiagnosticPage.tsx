import React, { useState, useEffect } from 'react';
import DiagnosticComponent from '../components/DiagnosticComponent';
import { apiService } from '../services/api.service';

const DiagnosticPage: React.FC = () => {
  const [studentId] = useState('550e8400-e29b-41d4-a716-446655440003'); // ID del estudiante de prueba
  const [healthStatus, setHealthStatus] = useState<{
    gateway: boolean;
    aiTutor: boolean;
    loading: boolean;
  }>({
    gateway: false,
    aiTutor: false,
    loading: true,
  });

  useEffect(() => {
    checkServicesHealth();
  }, []);

  const checkServicesHealth = async () => {
    try {
      const [gatewayResponse, aiTutorResponse] = await Promise.all([
        apiService.checkGatewayHealth(),
        apiService.checkAiTutorHealth(),
      ]);

      setHealthStatus({
        gateway: gatewayResponse.status === 200,
        aiTutor: aiTutorResponse.status === 200,
        loading: false,
      });
    } catch (error) {
      console.error('Error checking services health:', error);
      setHealthStatus({
        gateway: false,
        aiTutor: false,
        loading: false,
      });
    }
  };

  const handleDiagnosticCompleted = (profile: any) => {
    console.log('Diagnóstico completado:', profile);
    // Aquí podrías redirigir a otra página o mostrar más información
  };

  if (healthStatus.loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="inline-block p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
            <div className="spinner border-white"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">🔍 Verificando Servicios</h3>
          <p className="text-gray-600">Conectando con la infraestructura AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-block p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-6">
          <span className="text-4xl text-white">🧠</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Diagnóstico de Aprendizaje AI
        </h1>
        <p className="text-xl text-blue-100 max-w-2xl mx-auto">
          Descubre tu estilo de aprendizaje personalizado con nuestra inteligencia artificial avanzada
        </p>
      </div>

      {/* Service Status Card */}
      <div className="glass-card rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="mr-2">🔍</span>
            Estado de Servicios
          </h3>
          <button 
            onClick={checkServicesHealth}
            className="glass px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-white/20 transition-all duration-200"
          >
            🔄 Verificar
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex items-center p-3 bg-gray-50 rounded-xl">
            <div className={`w-3 h-3 rounded-full mr-3 ${healthStatus.gateway ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="font-medium text-gray-700">API Gateway</span>
            <span className={`ml-auto text-sm px-2 py-1 rounded-full ${healthStatus.gateway ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {healthStatus.gateway ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-xl">
            <div className={`w-3 h-3 rounded-full mr-3 ${healthStatus.aiTutor ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="font-medium text-gray-700">AI-Tutor Service</span>
            <span className={`ml-auto text-sm px-2 py-1 rounded-full ${healthStatus.aiTutor ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {healthStatus.aiTutor ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
      </div>

      {/* Diagnostic Component or Error */}
      {healthStatus.gateway && healthStatus.aiTutor ? (
        <div className="mb-8">
          <DiagnosticComponent 
            studentId={studentId}
            onCompleted={handleDiagnosticCompleted}
          />
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-8 border-red-200 mb-8">
          <div className="text-center">
            <div className="inline-block p-4 rounded-full bg-red-100 mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold text-red-800 mb-4">
              Servicios No Disponibles
            </h3>
            <p className="text-red-600 mb-6 max-w-2xl mx-auto">
              No se puede conectar con los servicios necesarios para realizar el diagnóstico.
            </p>
            
            <div className="bg-red-50 rounded-xl p-4 mb-6 text-left max-w-2xl mx-auto">
              <h4 className="font-semibold text-red-800 mb-2">Verifica que:</h4>
              <ul className="space-y-2 text-red-700">
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  AI-Tutor Service esté ejecutándose en puerto 5001
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  API Gateway esté ejecutándose en puerto 4000
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  Los servicios estén configurados correctamente
                </li>
              </ul>
            </div>
            
            <button 
              onClick={checkServicesHealth}
              className="btn-primary bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              🔄 Reintentar Conexión
            </button>
          </div>
        </div>
      )}

      {/* Information Section */}
      <div className="glass-card rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
            <span className="text-2xl text-white">💡</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            ¿Cómo funciona el diagnóstico?
          </h3>
          <p className="text-gray-600">Tecnología de vanguardia para personalizar tu experiencia de aprendizaje</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass p-6 rounded-xl text-center hover:scale-105 transition-transform duration-300">
            <div className="text-3xl mb-3">🎯</div>
            <h4 className="font-semibold text-gray-800 mb-2">Evaluación Multidimensional</h4>
            <p className="text-sm text-gray-600">
              Analizamos tu estilo de aprendizaje, ritmo preferido, nivel de dificultad,
              intereses y factores de motivación.
            </p>
          </div>
          
          <div className="glass p-6 rounded-xl text-center hover:scale-105 transition-transform duration-300">
            <div className="text-3xl mb-3">🧠</div>
            <h4 className="font-semibold text-gray-800 mb-2">Inteligencia Artificial</h4>
            <p className="text-sm text-gray-600">
              Utilizamos algoritmos de machine learning similares a Knewton para
              generar recomendaciones personalizadas.
            </p>
          </div>
          
          <div className="glass p-6 rounded-xl text-center hover:scale-105 transition-transform duration-300">
            <div className="text-3xl mb-3">⚡</div>
            <h4 className="font-semibold text-gray-800 mb-2">Tiempo Real</h4>
            <p className="text-sm text-gray-600">
              Los resultados se procesan instantáneamente y se adaptan
              según tus respuestas y tiempo de reacción.
            </p>
          </div>
          
          <div className="glass p-6 rounded-xl text-center hover:scale-105 transition-transform duration-300">
            <div className="text-3xl mb-3">📊</div>
            <h4 className="font-semibold text-gray-800 mb-2">Perfil Completo</h4>
            <p className="text-sm text-gray-600">
              Obtienes un perfil detallado con fortalezas, debilidades y
              recomendaciones específicas de aprendizaje.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPage;