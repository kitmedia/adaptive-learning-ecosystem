/**
 * Course Editor - Adaptive Learning Ecosystem
 * EbroValley Digital - Advanced course creation and editing interface
 * 
 * Rich text editor with AI assistance for course content creation
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface Course {
  id?: string;
  title: string;
  description: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  learning_objectives: string[];
  prerequisites: string[];
  category: string;
  language: string;
  price: number;
  is_free: boolean;
  thumbnail_url?: string;
  introduction_video_url?: string;
  course_outline: CourseSection[];
}

interface CourseSection {
  id: string;
  title: string;
  description: string;
  order_index: number;
  lessons: LessonOutline[];
}

interface LessonOutline {
  id: string;
  title: string;
  content_type: 'text' | 'video' | 'interactive' | 'assessment';
  duration_minutes: number;
  order_index: number;
}

interface CourseEditorProps {
  course?: Course;
  onSave: (course: Course) => Promise<void>;
  onCancel: () => void;
}

// =============================================================================
// COURSE EDITOR COMPONENT
// =============================================================================

export const CourseEditor: React.FC<CourseEditorProps> = ({ 
  course, 
  onSave, 
  onCancel 
}) => {
  const { user } = useAuth();
  const [loading, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'settings' | 'preview'>('basic');
  
  // Form state
  const [formData, setFormData] = useState<Course>({
    title: '',
    description: '',
    difficulty_level: 'beginner',
    estimated_duration: 60,
    tags: [],
    status: 'draft',
    learning_objectives: [''],
    prerequisites: [],
    category: '',
    language: 'es',
    price: 0,
    is_free: true,
    course_outline: [],
    ...course
  });

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiSuggestion, setAISuggestion] = useState<string>('');
  const [tagInput, setTagInput] = useState('');

  // Refs
  const titleRef = useRef<HTMLInputElement>(null);

  // =============================================================================
  // VALIDATION
  // =============================================================================

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    } else if (formData.title.length < 5) {
      newErrors.title = 'El título debe tener al menos 5 caracteres';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    } else if (formData.description.length < 20) {
      newErrors.description = 'La descripción debe tener al menos 20 caracteres';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'La categoría es requerida';
    }

    if (formData.learning_objectives.filter(obj => obj.trim()).length === 0) {
      newErrors.learning_objectives = 'Debe especificar al menos un objetivo de aprendizaje';
    }

    if (formData.estimated_duration < 5) {
      newErrors.estimated_duration = 'La duración debe ser de al menos 5 minutos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleInputChange = (field: keyof Course, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleLearningObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...formData.learning_objectives];
    newObjectives[index] = value;
    handleInputChange('learning_objectives', newObjectives);
  };

  const addLearningObjective = () => {
    handleInputChange('learning_objectives', [...formData.learning_objectives, '']);
  };

  const removeLearningObjective = (index: number) => {
    const newObjectives = formData.learning_objectives.filter((_, i) => i !== index);
    handleInputChange('learning_objectives', newObjectives);
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      await onSave(formData);
    } catch (error) {
      console.error('Error saving course:', error);
    } finally {
      setSaving(false);
    }
  };

  const generateAISuggestion = async (field: string) => {
    setShowAIAssistant(true);
    
    // Mock AI suggestion - replace with actual AI service
    const suggestions = {
      title: [
        'Domina JavaScript desde Cero: Guía Completa para Desarrolladores',
        'JavaScript Moderno: De Principiante a Experto en 8 Semanas',
        'Programación Web con JavaScript: Fundamentos y Proyectos Prácticos'
      ],
      description: [
        'Un curso completo que te llevará desde los conceptos básicos de JavaScript hasta técnicas avanzadas. Aprenderás a crear aplicaciones web interactivas, manejar APIs, y dominar las mejores prácticas de programación moderna.',
        'Descubre el poder de JavaScript con este curso diseñado para principiantes. Incluye proyectos prácticos, ejercicios interactivos y mentoring personalizado para garantizar tu éxito.'
      ],
      objectives: [
        'Comprender los fundamentos de JavaScript y la programación orientada a objetos',
        'Crear aplicaciones web interactivas usando DOM y eventos',
        'Manejar datos asíncronos con Promises y async/await',
        'Implementar mejores prácticas de desarrollo y debugging'
      ]
    };

    const fieldSuggestions = suggestions[field as keyof typeof suggestions];
    if (fieldSuggestions) {
      setAISuggestion(fieldSuggestions[Math.floor(Math.random() * fieldSuggestions.length)]);
    }
  };

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
  }, []);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderTabNavigation = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {[
          { key: 'basic', label: 'Información Básica', icon: '📝' },
          { key: 'content', label: 'Estructura del Curso', icon: '📚' },
          { key: 'settings', label: 'Configuración', icon: '⚙️' },
          { key: 'preview', label: 'Vista Previa', icon: '👁️' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );

  const renderBasicInfo = () => (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Título del Curso *
          </label>
          <button
            onClick={() => generateAISuggestion('title')}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            🤖 Sugerir con IA
          </button>
        </div>
        <input
          ref={titleRef}
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Ej: Introducción a JavaScript para Principiantes"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Descripción *
          </label>
          <button
            onClick={() => generateAISuggestion('description')}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            🤖 Sugerir con IA
          </button>
        </div>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Describe qué aprenderán los estudiantes en este curso..."
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      {/* Category and Difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría *
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.category ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Seleccionar categoría</option>
            <option value="programming">Programación</option>
            <option value="web-development">Desarrollo Web</option>
            <option value="data-science">Ciencia de Datos</option>
            <option value="design">Diseño</option>
            <option value="business">Negocios</option>
            <option value="languages">Idiomas</option>
            <option value="mathematics">Matemáticas</option>
            <option value="science">Ciencias</option>
          </select>
          {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nivel de Dificultad
          </label>
          <select
            value={formData.difficulty_level}
            onChange={(e) => handleInputChange('difficulty_level', e.target.value as any)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="beginner">Principiante</option>
            <option value="intermediate">Intermedio</option>
            <option value="advanced">Avanzado</option>
          </select>
        </div>
      </div>

      {/* Duration and Language */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duración Estimada (minutos)
          </label>
          <input
            type="number"
            min="5"
            value={formData.estimated_duration}
            onChange={(e) => handleInputChange('estimated_duration', parseInt(e.target.value) || 0)}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.estimated_duration ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.estimated_duration && <p className="mt-1 text-sm text-red-600">{errors.estimated_duration}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Idioma
          </label>
          <select
            value={formData.language}
            onChange={(e) => handleInputChange('language', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="es">Español</option>
            <option value="en">Inglés</option>
            <option value="fr">Francés</option>
            <option value="de">Alemán</option>
            <option value="pt">Portugués</option>
          </select>
        </div>
      </div>

      {/* Learning Objectives */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Objetivos de Aprendizaje *
          </label>
          <button
            onClick={() => generateAISuggestion('objectives')}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            🤖 Sugerir con IA
          </button>
        </div>
        <div className="space-y-2">
          {formData.learning_objectives.map((objective, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={objective}
                onChange={(e) => handleLearningObjectiveChange(index, e.target.value)}
                placeholder="Ej: El estudiante será capaz de..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              {formData.learning_objectives.length > 1 && (
                <button
                  onClick={() => removeLearningObjective(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  ❌
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addLearningObjective}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            ➕ Agregar objetivo
          </button>
        </div>
        {errors.learning_objectives && <p className="mt-1 text-sm text-red-600">{errors.learning_objectives}</p>}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Etiquetas
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
            placeholder="Agregar etiqueta..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleTagAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );

  const renderContentStructure = () => (
    <div className="space-y-6">
      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Estructura del Curso
        </h3>
        <p className="text-gray-600 mb-4">
          Organiza tu curso en secciones y lecciones
        </p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          🗂️ Crear Primera Sección
        </button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Pricing */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Configuración de Precio
        </label>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="radio"
              id="free"
              name="pricing"
              checked={formData.is_free}
              onChange={() => {
                handleInputChange('is_free', true);
                handleInputChange('price', 0);
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <label htmlFor="free" className="ml-3 block text-sm text-gray-700">
              Curso gratuito
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="paid"
              name="pricing"
              checked={!formData.is_free}
              onChange={() => handleInputChange('is_free', false)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <label htmlFor="paid" className="ml-3 block text-sm text-gray-700">
              Curso de pago
            </label>
          </div>
          {!formData.is_free && (
            <div className="ml-7">
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">€</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className="block w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estado del Curso
        </label>
        <select
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value as any)}
          className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
          <option value="archived">Archivado</option>
        </select>
        <p className="mt-1 text-sm text-gray-500">
          {formData.status === 'draft' && 'El curso está en desarrollo y no es visible para estudiantes'}
          {formData.status === 'published' && 'El curso está disponible para que los estudiantes se inscriban'}
          {formData.status === 'archived' && 'El curso no acepta nuevas inscripciones'}
        </p>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{formData.title || 'Título del curso'}</h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span className={`px-2 py-1 rounded-full text-xs ${
              formData.difficulty_level === 'beginner' ? 'bg-green-100 text-green-800' :
              formData.difficulty_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {formData.difficulty_level === 'beginner' ? 'Principiante' :
               formData.difficulty_level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
            </span>
            <span>⏱️ {formData.estimated_duration} minutos</span>
            <span>🌐 {formData.language === 'es' ? 'Español' : formData.language}</span>
            <span className={`font-medium ${formData.is_free ? 'text-green-600' : 'text-blue-600'}`}>
              {formData.is_free ? 'Gratis' : `€${formData.price}`}
            </span>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <p className="text-gray-700 mb-4">
            {formData.description || 'Descripción del curso aparecerá aquí...'}
          </p>
          
          {formData.learning_objectives.filter(obj => obj.trim()).length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Lo que aprenderás:</h3>
              <ul className="list-disc list-inside space-y-1">
                {formData.learning_objectives.filter(obj => obj.trim()).map((objective, index) => (
                  <li key={index} className="text-gray-700">{objective}</li>
                ))}
              </ul>
            </div>
          )}
          
          {formData.tags.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Etiquetas:</h3>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // =============================================================================
  // AI ASSISTANT MODAL
  // =============================================================================

  const renderAIAssistant = () => (
    showAIAssistant && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">🤖 Asistente IA</h3>
              <button
                onClick={() => setShowAIAssistant(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Sugerencia generada:</p>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-gray-800">{aiSuggestion}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // Apply suggestion logic here
                  setShowAIAssistant(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Usar sugerencia
              </button>
              <button
                onClick={() => setShowAIAssistant(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {course ? 'Editar Curso' : 'Crear Nuevo Curso'}
        </h1>
        <p className="text-gray-600">
          {course ? 'Modifica la información de tu curso' : 'Crea un nuevo curso desde cero'}
        </p>
      </div>

      {/* Tab Navigation */}
      {renderTabNavigation()}

      {/* Tab Content */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        {activeTab === 'basic' && renderBasicInfo()}
        {activeTab === 'content' && renderContentStructure()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'preview' && renderPreview()}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={() => handleInputChange('status', 'draft')}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Guardar como Borrador
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : course ? 'Actualizar Curso' : 'Crear Curso'}
          </button>
        </div>
      </div>

      {/* AI Assistant Modal */}
      {renderAIAssistant()}
    </div>
  );
};

export default CourseEditor;