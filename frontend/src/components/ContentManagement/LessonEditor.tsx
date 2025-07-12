/**
 * Lesson Editor - Adaptive Learning Ecosystem
 * EbroValley Digital - Rich lesson content editor with multimedia support
 * 
 * Advanced lesson editor with rich text, media embedding, and interactive elements
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface Lesson {
  id?: string;
  course_id: string;
  title: string;
  content: string;
  content_type: 'text' | 'video' | 'interactive' | 'assessment';
  order_index: number;
  duration_minutes: number;
  objectives: string[];
  prerequisites: string[];
  status: 'draft' | 'published';
  tags: string[];
  difficulty_level: 'easy' | 'medium' | 'hard';
  media_files: MediaFile[];
  interactive_elements: InteractiveElement[];
  assessment_questions: AssessmentQuestion[];
}

interface MediaFile {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  filename: string;
  description?: string;
  timestamp?: number; // For video annotations
}

interface InteractiveElement {
  id: string;
  type: 'quiz' | 'code_editor' | 'simulation' | 'drag_drop';
  title: string;
  content: any;
  position_in_content: number;
}

interface AssessmentQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'open_ended' | 'code';
  question: string;
  options?: string[];
  correct_answer: string | string[];
  explanation?: string;
  points: number;
}

interface LessonEditorProps {
  lesson?: Lesson;
  courseId: string;
  onSave: (lesson: Lesson) => Promise<void>;
  onCancel: () => void;
}

// =============================================================================
// LESSON EDITOR COMPONENT
// =============================================================================

export const LessonEditor: React.FC<LessonEditorProps> = ({ 
  lesson, 
  courseId,
  onSave, 
  onCancel 
}) => {
  const { user } = useAuth();
  const [loading, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'media' | 'interactive' | 'assessment' | 'settings'>('content');
  
  // Form state
  const [formData, setFormData] = useState<Lesson>({
    course_id: courseId,
    title: '',
    content: '',
    content_type: 'text',
    order_index: 1,
    duration_minutes: 15,
    objectives: [''],
    prerequisites: [],
    status: 'draft',
    tags: [],
    difficulty_level: 'easy',
    media_files: [],
    interactive_elements: [],
    assessment_questions: [],
    ...lesson
  });

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  // Refs
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // =============================================================================
  // VALIDATION
  // =============================================================================

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'El contenido es requerido';
    }

    if (formData.duration_minutes < 1) {
      newErrors.duration_minutes = 'La duración debe ser de al menos 1 minuto';
    }

    if (formData.objectives.filter(obj => obj.trim()).length === 0) {
      newErrors.objectives = 'Debe especificar al menos un objetivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleInputChange = (field: keyof Lesson, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleContentChange = (value: string) => {
    handleInputChange('content', value);
    if (contentRef.current) {
      setCursorPosition(contentRef.current.selectionStart);
    }
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index] = value;
    handleInputChange('objectives', newObjectives);
  };

  const addObjective = () => {
    handleInputChange('objectives', [...formData.objectives, '']);
  };

  const removeObjective = (index: number) => {
    const newObjectives = formData.objectives.filter((_, i) => i !== index);
    handleInputChange('objectives', newObjectives);
  };

  const insertMediaInContent = (mediaFile: MediaFile) => {
    const mediaMarkdown = generateMediaMarkdown(mediaFile);
    const content = formData.content;
    const newContent = content.slice(0, cursorPosition) + mediaMarkdown + content.slice(cursorPosition);
    handleInputChange('content', newContent);
  };

  const generateMediaMarkdown = (media: MediaFile): string => {
    switch (media.type) {
      case 'image':
        return `\n\n![${media.description || media.filename}](${media.url})\n\n`;
      case 'video':
        return `\n\n<video controls>\n  <source src="${media.url}" type="video/mp4">\n  Tu navegador no soporta video.\n</video>\n\n`;
      case 'audio':
        return `\n\n<audio controls>\n  <source src="${media.url}" type="audio/mpeg">\n  Tu navegador no soporta audio.\n</audio>\n\n`;
      default:
        return `\n\n[📎 ${media.filename}](${media.url})\n\n`;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    for (const file of files) {
      // Mock file upload - replace with actual upload service
      const mockMediaFile: MediaFile = {
        id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: file.type.startsWith('image/') ? 'image' :
              file.type.startsWith('video/') ? 'video' :
              file.type.startsWith('audio/') ? 'audio' : 'document',
        url: URL.createObjectURL(file),
        filename: file.name,
        description: file.name
      };

      const newMediaFiles = [...formData.media_files, mockMediaFile];
      handleInputChange('media_files', newMediaFiles);
    }
  };

  const addInteractiveElement = (type: InteractiveElement['type']) => {
    const newElement: InteractiveElement = {
      id: `interactive_${Date.now()}`,
      type,
      title: `Elemento ${type}`,
      content: {},
      position_in_content: formData.content.length
    };

    const newElements = [...formData.interactive_elements, newElement];
    handleInputChange('interactive_elements', newElements);

    // Insert placeholder in content
    const placeholder = `\n\n[INTERACTIVE:${newElement.id}]\n\n`;
    const newContent = formData.content + placeholder;
    handleInputChange('content', newContent);
  };

  const addAssessmentQuestion = () => {
    const newQuestion: AssessmentQuestion = {
      id: `question_${Date.now()}`,
      type: 'multiple_choice',
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1
    };

    const newQuestions = [...formData.assessment_questions, newQuestion];
    handleInputChange('assessment_questions', newQuestions);
  };

  const updateAssessmentQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...formData.assessment_questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    handleInputChange('assessment_questions', newQuestions);
  };

  const removeAssessmentQuestion = (index: number) => {
    const newQuestions = formData.assessment_questions.filter((_, i) => i !== index);
    handleInputChange('assessment_questions', newQuestions);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      await onSave(formData);
    } catch (error) {
      console.error('Error saving lesson:', error);
    } finally {
      setSaving(false);
    }
  };

  const generateAIContent = async () => {
    setShowAIAssistant(true);
    // Mock AI content generation - replace with actual AI service
    const aiSuggestions = [
      "# Introducción\n\nEn esta lección aprenderemos los conceptos fundamentales...",
      "## Objetivos de Aprendizaje\n\nAl finalizar esta lección podrás:\n- Entender los conceptos básicos\n- Aplicar las técnicas aprendidas\n- Resolver problemas prácticos",
      "### Ejercicio Práctico\n\nVamos a practicar con un ejemplo real:\n\n```javascript\nconst ejemplo = 'Hola Mundo';\nconsole.log(ejemplo);\n```"
    ];
    
    const suggestion = aiSuggestions[Math.floor(Math.random() * aiSuggestions.length)];
    const newContent = formData.content + '\n\n' + suggestion;
    handleInputChange('content', newContent);
    setShowAIAssistant(false);
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderTabNavigation = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {[
          { key: 'content', label: 'Contenido', icon: '📝' },
          { key: 'media', label: 'Media', icon: '🎬', count: formData.media_files.length },
          { key: 'interactive', label: 'Interactivo', icon: '🎯', count: formData.interactive_elements.length },
          { key: 'assessment', label: 'Evaluación', icon: '✅', count: formData.assessment_questions.length },
          { key: 'settings', label: 'Configuración', icon: '⚙️' }
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
            {tab.count !== undefined && tab.count > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );

  const renderContentTab = () => (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título de la Lección *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Ej: Variables y Tipos de Datos en JavaScript"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      {/* Content Editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Contenido de la Lección *
          </label>
          <div className="flex gap-2">
            <button
              onClick={generateAIContent}
              className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 px-2 py-1 border border-purple-300 rounded"
            >
              🤖 IA Asistente
            </button>
            <button
              onClick={() => setShowMediaUpload(true)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 border border-blue-300 rounded"
            >
              🎬 Insertar Media
            </button>
          </div>
        </div>
        
        <div className="border border-gray-300 rounded-md overflow-hidden">
          {/* Toolbar */}
          <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-2">
            <button
              onClick={() => {
                const selection = contentRef.current?.value.substring(
                  contentRef.current.selectionStart,
                  contentRef.current.selectionEnd
                );
                if (selection) {
                  const newContent = formData.content.replace(selection, `**${selection}**`);
                  handleInputChange('content', newContent);
                }
              }}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => {
                const selection = contentRef.current?.value.substring(
                  contentRef.current.selectionStart,
                  contentRef.current.selectionEnd
                );
                if (selection) {
                  const newContent = formData.content.replace(selection, `*${selection}*`);
                  handleInputChange('content', newContent);
                }
              }}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              <em>I</em>
            </button>
            <button
              onClick={() => {
                const newContent = formData.content + '\n\n# Título\n\n';
                handleInputChange('content', newContent);
              }}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              H1
            </button>
            <button
              onClick={() => {
                const newContent = formData.content + '\n\n```javascript\n// Tu código aquí\n```\n\n';
                handleInputChange('content', newContent);
              }}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              {'</>'}
            </button>
            <button
              onClick={() => {
                const newContent = formData.content + '\n\n- Elemento de lista\n';
                handleInputChange('content', newContent);
              }}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              • Lista
            </button>
          </div>
          
          {/* Text Area */}
          <textarea
            ref={contentRef}
            value={formData.content}
            onChange={(e) => handleContentChange(e.target.value)}
            rows={20}
            className={`block w-full px-3 py-2 border-0 focus:ring-0 focus:border-0 resize-none ${
              errors.content ? 'border-red-300' : ''
            }`}
            placeholder="Escribe el contenido de tu lección usando Markdown..."
          />
        </div>
        {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
        
        {/* Markdown Help */}
        <div className="mt-2 text-xs text-gray-500">
          <p>Usa Markdown para formatear: **negrita**, *cursiva*, # títulos, ```código```, [enlaces](url)</p>
        </div>
      </div>

      {/* Preview */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Vista Previa</h3>
        <div className="border border-gray-300 rounded-md p-4 bg-gray-50 max-h-60 overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            {formData.content ? (
              <pre className="whitespace-pre-wrap text-sm text-gray-700">
                {formData.content}
              </pre>
            ) : (
              <p className="text-gray-500 italic">La vista previa aparecerá aquí...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMediaTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Archivos Media</h3>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            📎 Subir Archivos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {formData.media_files.map((media, index) => (
          <div key={media.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 truncate">
                {media.filename}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {media.type}
              </span>
            </div>
            
            {media.type === 'image' && (
              <img
                src={media.url}
                alt={media.filename}
                className="w-full h-32 object-cover rounded mb-2"
              />
            )}
            
            <div className="flex gap-2">
              <button
                onClick={() => insertMediaInContent(media)}
                className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Insertar
              </button>
              <button
                onClick={() => {
                  const newMedia = formData.media_files.filter((_, i) => i !== index);
                  handleInputChange('media_files', newMedia);
                }}
                className="flex-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {formData.media_files.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-2">No hay archivos media agregados</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            📎 Subir primer archivo
          </button>
        </div>
      )}
    </div>
  );

  const renderInteractiveTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Elementos Interactivos</h3>
        <div className="flex gap-2">
          <button
            onClick={() => addInteractiveElement('quiz')}
            className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            + Quiz
          </button>
          <button
            onClick={() => addInteractiveElement('code_editor')}
            className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            + Editor Código
          </button>
          <button
            onClick={() => addInteractiveElement('simulation')}
            className="px-3 py-1 text-xs bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            + Simulación
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {formData.interactive_elements.map((element, index) => (
          <div key={element.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">{element.title}</h4>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  {element.type}
                </span>
                <button
                  onClick={() => {
                    const newElements = formData.interactive_elements.filter((_, i) => i !== index);
                    handleInputChange('interactive_elements', newElements);
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Tipo: {element.type}</p>
              <p>Posición en contenido: {element.position_in_content}</p>
            </div>
            
            <div className="mt-3">
              <input
                type="text"
                value={element.title}
                onChange={(e) => {
                  const newElements = [...formData.interactive_elements];
                  newElements[index] = { ...newElements[index], title: e.target.value };
                  handleInputChange('interactive_elements', newElements);
                }}
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Título del elemento interactivo"
              />
            </div>
          </div>
        ))}
      </div>

      {formData.interactive_elements.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-2">No hay elementos interactivos agregados</p>
          <p className="text-sm text-gray-400">Los elementos interactivos hacen más atractiva la lección</p>
        </div>
      )}
    </div>
  );

  const renderAssessmentTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Preguntas de Evaluación</h3>
        <button
          onClick={addAssessmentQuestion}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
        >
          + Agregar Pregunta
        </button>
      </div>

      <div className="space-y-6">
        {formData.assessment_questions.map((question, index) => (
          <div key={question.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Pregunta {index + 1}</h4>
              <button
                onClick={() => removeAssessmentQuestion(index)}
                className="text-red-600 hover:text-red-800"
              >
                🗑️
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Tipo de Pregunta</label>
                <select
                  value={question.type}
                  onChange={(e) => updateAssessmentQuestion(index, 'type', e.target.value)}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="multiple_choice">Opción Múltiple</option>
                  <option value="true_false">Verdadero/Falso</option>
                  <option value="open_ended">Respuesta Abierta</option>
                  <option value="code">Código</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-1">Puntos</label>
                <input
                  type="number"
                  min="1"
                  value={question.points}
                  onChange={(e) => updateAssessmentQuestion(index, 'points', parseInt(e.target.value) || 1)}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Pregunta</label>
              <textarea
                value={question.question}
                onChange={(e) => updateAssessmentQuestion(index, 'question', e.target.value)}
                rows={2}
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Escribe la pregunta..."
              />
            </div>

            {question.type === 'multiple_choice' && (
              <div className="mb-3">
                <label className="block text-sm text-gray-700 mb-1">Opciones</label>
                <div className="space-y-2">
                  {(question.options || []).map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct_${question.id}`}
                        checked={question.correct_answer === option}
                        onChange={() => updateAssessmentQuestion(index, 'correct_answer', option)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(question.options || [])];
                          newOptions[optionIndex] = e.target.value;
                          updateAssessmentQuestion(index, 'options', newOptions);
                        }}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Opción ${optionIndex + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-700 mb-1">Explicación (opcional)</label>
              <textarea
                value={question.explanation || ''}
                onChange={(e) => updateAssessmentQuestion(index, 'explanation', e.target.value)}
                rows={2}
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Explica por qué esta es la respuesta correcta..."
              />
            </div>
          </div>
        ))}
      </div>

      {formData.assessment_questions.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-2">No hay preguntas de evaluación</p>
          <p className="text-sm text-gray-400">Las evaluaciones ayudan a medir el aprendizaje</p>
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* Lesson Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Contenido
          </label>
          <select
            value={formData.content_type}
            onChange={(e) => handleInputChange('content_type', e.target.value as any)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="text">Texto</option>
            <option value="video">Video</option>
            <option value="interactive">Interactivo</option>
            <option value="assessment">Evaluación</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duración (minutos) *
          </label>
          <input
            type="number"
            min="1"
            value={formData.duration_minutes}
            onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 0)}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.duration_minutes ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.duration_minutes && <p className="mt-1 text-sm text-red-600">{errors.duration_minutes}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Orden en el Curso
          </label>
          <input
            type="number"
            min="1"
            value={formData.order_index}
            onChange={(e) => handleInputChange('order_index', parseInt(e.target.value) || 1)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dificultad
          </label>
          <select
            value={formData.difficulty_level}
            onChange={(e) => handleInputChange('difficulty_level', e.target.value as any)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="easy">Fácil</option>
            <option value="medium">Medio</option>
            <option value="hard">Difícil</option>
          </select>
        </div>
      </div>

      {/* Objectives */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Objetivos de la Lección *
        </label>
        <div className="space-y-2">
          {formData.objectives.map((objective, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={objective}
                onChange={(e) => handleObjectiveChange(index, e.target.value)}
                placeholder="Ej: El estudiante comprenderá..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              {formData.objectives.length > 1 && (
                <button
                  onClick={() => removeObjective(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  ❌
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addObjective}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            ➕ Agregar objetivo
          </button>
        </div>
        {errors.objectives && <p className="mt-1 text-sm text-red-600">{errors.objectives}</p>}
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estado
        </label>
        <select
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value as any)}
          className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
        </select>
      </div>
    </div>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {lesson ? 'Editar Lección' : 'Crear Nueva Lección'}
        </h1>
        <p className="text-gray-600">
          {lesson ? 'Modifica el contenido de tu lección' : 'Crea una nueva lección desde cero'}
        </p>
      </div>

      {/* Tab Navigation */}
      {renderTabNavigation()}

      {/* Tab Content */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        {activeTab === 'content' && renderContentTab()}
        {activeTab === 'media' && renderMediaTab()}
        {activeTab === 'interactive' && renderInteractiveTab()}
        {activeTab === 'assessment' && renderAssessmentTab()}
        {activeTab === 'settings' && renderSettingsTab()}
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
            onClick={() => {
              handleInputChange('status', 'draft');
              handleSave();
            }}
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
            {loading ? 'Guardando...' : lesson ? 'Actualizar Lección' : 'Crear Lección'}
          </button>
        </div>
      </div>

      {/* AI Assistant Modal */}
      {showAIAssistant && (
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
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Generando contenido con IA...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonEditor;