/**
 * Content Management Dashboard - Adaptive Learning Ecosystem
 * EbroValley Digital - Course and content creation interface
 * 
 * Comprehensive content management system for educators and content creators
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  author_id: string;
  lessons_count: number;
  students_enrolled: number;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string;
  content_type: 'text' | 'video' | 'interactive' | 'assessment';
  order_index: number;
  duration_minutes: number;
  objectives: string[];
  prerequisites: string[];
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

interface MediaFile {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  url: string;
  upload_date: string;
  used_in_content: boolean;
}

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  template_content: string;
  category: string;
  usage_count: number;
}

// =============================================================================
// CONTENT MANAGEMENT DASHBOARD COMPONENT
// =============================================================================

export const ContentManagementDashboard: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'courses' | 'lessons' | 'media' | 'templates'>('courses');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for different content types
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);

  // Selected items for editing
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockCourses: Course[] = [
        {
          id: '1',
          title: 'Introducción a JavaScript',
          description: 'Curso completo de JavaScript desde cero',
          difficulty_level: 'beginner',
          estimated_duration: 40,
          tags: ['javascript', 'programación', 'web'],
          status: 'published',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-15T00:00:00Z',
          author_id: user?.id || 'anonymous',
          lessons_count: 12,
          students_enrolled: 145
        },
        {
          id: '2',
          title: 'React Avanzado',
          description: 'Técnicas avanzadas de React y TypeScript',
          difficulty_level: 'advanced',
          estimated_duration: 60,
          tags: ['react', 'typescript', 'frontend'],
          status: 'draft',
          created_at: '2025-01-10T00:00:00Z',
          updated_at: '2025-01-20T00:00:00Z',
          author_id: user?.id || 'anonymous',
          lessons_count: 8,
          students_enrolled: 0
        }
      ];
      setCourses(mockCourses);
    } catch (err) {
      setError('Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchLessons = useCallback(async (courseId?: string) => {
    try {
      setLoading(true);
      // Mock data for now
      const mockLessons: Lesson[] = [
        {
          id: '1',
          course_id: '1',
          title: 'Variables y Tipos de Datos',
          content: 'Contenido de la lección sobre variables...',
          content_type: 'text',
          order_index: 1,
          duration_minutes: 25,
          objectives: ['Entender variables', 'Conocer tipos de datos'],
          prerequisites: [],
          status: 'published',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-05T00:00:00Z'
        },
        {
          id: '2',
          course_id: '1',
          title: 'Funciones en JavaScript',
          content: 'Contenido sobre funciones...',
          content_type: 'interactive',
          order_index: 2,
          duration_minutes: 35,
          objectives: ['Crear funciones', 'Entender scope'],
          prerequisites: ['Variables y Tipos de Datos'],
          status: 'published',
          created_at: '2025-01-03T00:00:00Z',
          updated_at: '2025-01-06T00:00:00Z'
        }
      ];
      
      const filteredLessons = courseId 
        ? mockLessons.filter(lesson => lesson.course_id === courseId)
        : mockLessons;
      
      setLessons(filteredLessons);
    } catch (err) {
      setError('Error al cargar lecciones');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMediaFiles = useCallback(async () => {
    try {
      setLoading(true);
      // Mock data
      const mockMedia: MediaFile[] = [
        {
          id: '1',
          filename: 'intro-video.mp4',
          file_type: 'video/mp4',
          file_size: 45678901,
          url: '/media/intro-video.mp4',
          upload_date: '2025-01-01T00:00:00Z',
          used_in_content: true
        },
        {
          id: '2',
          filename: 'diagram-functions.png',
          file_type: 'image/png',
          file_size: 234567,
          url: '/media/diagram-functions.png',
          upload_date: '2025-01-02T00:00:00Z',
          used_in_content: true
        }
      ];
      setMediaFiles(mockMedia);
    } catch (err) {
      setError('Error al cargar archivos media');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      // Mock data
      const mockTemplates: ContentTemplate[] = [
        {
          id: '1',
          name: 'Lección Interactiva',
          description: 'Template para lecciones con ejercicios prácticos',
          template_content: '# Título\n\n## Objetivos\n- Objetivo 1\n- Objetivo 2\n\n## Contenido\n\n## Ejercicios',
          category: 'lesson',
          usage_count: 15
        },
        {
          id: '2',
          name: 'Quiz de Evaluación',
          description: 'Template para crear quizzes rápidos',
          template_content: '# Quiz: {title}\n\n## Pregunta 1\n- A) Opción A\n- B) Opción B\n- C) Opción C\n- D) Opción D',
          category: 'assessment',
          usage_count: 8
        }
      ];
      setTemplates(mockTemplates);
    } catch (err) {
      setError('Error al cargar templates');
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    fetchCourses();
    fetchMediaFiles();
    fetchTemplates();
  }, [fetchCourses, fetchMediaFiles, fetchTemplates]);

  useEffect(() => {
    if (currentView === 'lessons') {
      fetchLessons();
    }
  }, [currentView, fetchLessons]);

  // =============================================================================
  // FILTERING AND SEARCH
  // =============================================================================

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || course.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [courses, searchQuery, filterStatus]);

  const filteredLessons = useMemo(() => {
    return lessons.filter(lesson => {
      const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           lesson.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || lesson.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [lessons, searchQuery, filterStatus]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleCreateCourse = () => {
    setSelectedCourse(null);
    setShowCreateForm(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowCreateForm(true);
  };

  const handleCreateLesson = () => {
    setSelectedLesson(null);
    setShowCreateForm(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowCreateForm(true);
  };

  const handleViewChange = (view: 'courses' | 'lessons' | 'media' | 'templates') => {
    setCurrentView(view);
    setShowCreateForm(false);
    setSelectedCourse(null);
    setSelectedLesson(null);
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderNavigationTabs = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {[
          { key: 'courses', label: 'Cursos', count: courses.length },
          { key: 'lessons', label: 'Lecciones', count: lessons.length },
          { key: 'media', label: 'Media', count: mediaFiles.length },
          { key: 'templates', label: 'Templates', count: templates.length }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleViewChange(tab.key as any)}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              currentView === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );

  const renderSearchAndFilters = () => (
    <div className="mb-6 flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Buscar contenido..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="flex gap-2">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
          <option value="archived">Archivado</option>
        </select>
        <button
          onClick={currentView === 'courses' ? handleCreateCourse : handleCreateLesson}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
        >
          + Crear {currentView === 'courses' ? 'Curso' : 'Lección'}
        </button>
      </div>
    </div>
  );

  const renderCoursesList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredCourses.map((course) => (
        <div key={course.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {course.title}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                course.status === 'published' ? 'bg-green-100 text-green-800' :
                course.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {course.status}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {course.description}
            </p>
            
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span className="flex items-center">
                📚 {course.lessons_count} lecciones
              </span>
              <span className="flex items-center">
                👥 {course.students_enrolled} estudiantes
              </span>
            </div>
            
            <div className="flex flex-wrap gap-1 mb-4">
              {course.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
              {course.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  +{course.tags.length - 3}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleEditCourse(course)}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Editar
              </button>
              <button
                onClick={() => fetchLessons(course.id)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Ver Lecciones
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderLessonsList = () => (
    <div className="space-y-4">
      {filteredLessons.map((lesson) => (
        <div key={lesson.id} className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {lesson.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                lesson.status === 'published' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {lesson.status}
              </span>
              <span className="text-sm text-gray-500">
                {lesson.duration_minutes} min
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <span>Orden: {lesson.order_index}</span>
            <span>Tipo: {lesson.content_type}</span>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-1">Objetivos:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {lesson.objectives.map((objective, index) => (
                <li key={index}>{objective}</li>
              ))}
            </ul>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleEditLesson(lesson)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Editar
            </button>
            <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
              Previsualizar
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMediaList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mediaFiles.map((file) => (
        <div key={file.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900 truncate">
              {file.filename}
            </h3>
            <span className={`px-2 py-1 text-xs rounded-full ${
              file.used_in_content ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {file.used_in_content ? 'En uso' : 'Sin usar'}
            </span>
          </div>
          
          <div className="text-sm text-gray-600 mb-3">
            <p>Tipo: {file.file_type}</p>
            <p>Tamaño: {(file.file_size / 1024 / 1024).toFixed(2)} MB</p>
            <p>Subido: {new Date(file.upload_date).toLocaleDateString()}</p>
          </div>
          
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              Ver
            </button>
            <button className="flex-1 px-3 py-2 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50">
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTemplatesList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {templates.map((template) => (
        <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {template.name}
            </h3>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              {template.category}
            </span>
          </div>
          
          <p className="text-gray-600 text-sm mb-3">
            {template.description}
          </p>
          
          <div className="text-sm text-gray-500 mb-4">
            Usado {template.usage_count} veces
          </div>
          
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">
              Usar Template
            </button>
            <button className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
              Editar
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Contenidos
          </h1>
          <p className="mt-2 text-gray-600">
            Crea, edita y gestiona cursos, lecciones y material educativo
          </p>
        </div>

        {/* Navigation Tabs */}
        {renderNavigationTabs()}

        {/* Search and Filters */}
        {(currentView === 'courses' || currentView === 'lessons') && renderSearchAndFilters()}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Content Display */}
        {!loading && (
          <>
            {currentView === 'courses' && renderCoursesList()}
            {currentView === 'lessons' && renderLessonsList()}
            {currentView === 'media' && renderMediaList()}
            {currentView === 'templates' && renderTemplatesList()}
          </>
        )}

        {/* Empty State */}
        {!loading && (
          (currentView === 'courses' && filteredCourses.length === 0) ||
          (currentView === 'lessons' && filteredLessons.length === 0) ||
          (currentView === 'media' && mediaFiles.length === 0) ||
          (currentView === 'templates' && templates.length === 0)
        ) && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron {currentView}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Intenta con diferentes términos de búsqueda' : `Aún no has creado ningún ${currentView.slice(0, -1)}`}
            </p>
            {!searchQuery && (
              <button
                onClick={currentView === 'courses' ? handleCreateCourse : handleCreateLesson}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Crear {currentView === 'courses' ? 'Primer Curso' : 'Primera Lección'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentManagementDashboard;