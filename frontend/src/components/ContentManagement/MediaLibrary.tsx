/**
 * Media Library - Adaptive Learning Ecosystem
 * EbroValley Digital - Comprehensive media management system
 * 
 * Advanced media library with upload, organization, and asset management
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface MediaFile {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  width?: number;
  height?: number;
  duration?: number; // for video/audio
  url: string;
  thumbnail_url?: string;
  description?: string;
  alt_text?: string;
  tags: string[];
  upload_date: string;
  uploaded_by: string;
  used_in_content: string[]; // IDs of courses/lessons using this media
  folder_id?: string;
  is_public: boolean;
  metadata: Record<string, any>;
}

interface MediaFolder {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at: string;
  media_count: number;
  children?: MediaFolder[];
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  result?: MediaFile;
}

interface MediaLibraryProps {
  onSelectMedia?: (media: MediaFile[]) => void;
  allowMultiSelect?: boolean;
  acceptedTypes?: string[];
  maxFileSize?: number; // in bytes
}

// =============================================================================
// MEDIA LIBRARY COMPONENT
// =============================================================================

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onSelectMedia,
  allowMultiSelect = true,
  acceptedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf'],
  maxFileSize = 100 * 1024 * 1024 // 100MB default
}) => {
  const { user } = useAuth();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [currentFolder, setCurrentFolder] = useState<string>('');
  
  // Data state
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  const fetchMediaFiles = useCallback(async (folderId?: string) => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API call
      const mockFiles: MediaFile[] = [
        {
          id: '1',
          filename: 'javascript-intro.mp4',
          original_filename: 'JavaScript Introduction.mp4',
          file_type: 'video/mp4',
          file_size: 45678901,
          width: 1920,
          height: 1080,
          duration: 1245, // seconds
          url: '/media/javascript-intro.mp4',
          thumbnail_url: '/media/thumbnails/javascript-intro.jpg',
          description: 'Video introducción a JavaScript',
          alt_text: 'Pantalla de código JavaScript',
          tags: ['javascript', 'programación', 'tutorial'],
          upload_date: '2025-01-01T00:00:00Z',
          uploaded_by: user?.id || 'user1',
          used_in_content: ['course_1', 'lesson_1'],
          folder_id: folderId || '',
          is_public: true,
          metadata: {
            bitrate: '2000kbps',
            fps: 30,
            codec: 'h264'
          }
        },
        {
          id: '2',
          filename: 'functions-diagram.png',
          original_filename: 'Functions Diagram.png',
          file_type: 'image/png',
          file_size: 234567,
          width: 800,
          height: 600,
          url: '/media/functions-diagram.png',
          description: 'Diagrama explicativo de funciones',
          alt_text: 'Diagrama de flujo mostrando el concepto de funciones',
          tags: ['diagrama', 'funciones', 'visual'],
          upload_date: '2025-01-02T00:00:00Z',
          uploaded_by: user?.id || 'user1',
          used_in_content: ['lesson_2'],
          folder_id: folderId || '',
          is_public: true,
          metadata: {
            dpi: 72,
            color_profile: 'sRGB'
          }
        },
        {
          id: '3',
          filename: 'course-syllabus.pdf',
          original_filename: 'Course Syllabus.pdf',
          file_type: 'application/pdf',
          file_size: 876543,
          url: '/media/course-syllabus.pdf',
          description: 'Syllabus del curso de JavaScript',
          tags: ['syllabus', 'documento', 'curso'],
          upload_date: '2025-01-03T00:00:00Z',
          uploaded_by: user?.id || 'user1',
          used_in_content: ['course_1'],
          folder_id: folderId || '',
          is_public: false,
          metadata: {
            pages: 12,
            author: 'Instructor'
          }
        }
      ];

      setMediaFiles(mockFiles);
    } catch (error) {
      console.error('Error fetching media files:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchFolders = useCallback(async () => {
    try {
      // Mock data
      const mockFolders: MediaFolder[] = [
        {
          id: 'folder_1',
          name: 'Imágenes',
          description: 'Todas las imágenes del curso',
          created_at: '2025-01-01T00:00:00Z',
          media_count: 15
        },
        {
          id: 'folder_2',
          name: 'Videos',
          description: 'Videos educativos',
          created_at: '2025-01-01T00:00:00Z',
          media_count: 8
        },
        {
          id: 'folder_3',
          name: 'Documentos',
          description: 'PDFs y documentos',
          created_at: '2025-01-01T00:00:00Z',
          media_count: 5
        }
      ];

      setFolders(mockFolders);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  }, []);

  // =============================================================================
  // FILE UPLOAD HANDLERS
  // =============================================================================

  const handleFileSelect = (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Validate files
    const validFiles = fileArray.filter(file => {
      if (file.size > maxFileSize) {
        alert(`Archivo ${file.name} es demasiado grande. Máximo ${maxFileSize / 1024 / 1024}MB`);
        return false;
      }
      
      const isValidType = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });
      
      if (!isValidType) {
        alert(`Tipo de archivo ${file.type} no permitido`);
        return false;
      }
      
      return true;
    });

    // Start upload for each file
    validFiles.forEach(file => uploadFile(file));
  };

  const uploadFile = async (file: File) => {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize upload progress
    const initialProgress: UploadProgress = {
      file,
      progress: 0,
      status: 'uploading'
    };
    
    setUploadProgress(prev => [...prev, initialProgress]);

    try {
      // Mock upload process - replace with actual upload
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setUploadProgress(prev => 
          prev.map(upload => 
            upload.file === file ? { ...upload, progress } : upload
          )
        );
      }

      // Mock processing
      setUploadProgress(prev => 
        prev.map(upload => 
          upload.file === file ? { ...upload, status: 'processing' } : upload
        )
      );

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create mock media file result
      const result: MediaFile = {
        id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        filename: file.name.toLowerCase().replace(/[^a-z0-9.-]/g, '-'),
        original_filename: file.name,
        file_type: file.type,
        file_size: file.size,
        url: URL.createObjectURL(file),
        description: '',
        alt_text: '',
        tags: [],
        upload_date: new Date().toISOString(),
        uploaded_by: user?.id || 'anonymous',
        used_in_content: [],
        folder_id: currentFolder,
        is_public: true,
        metadata: {}
      };

      // Add to media files
      setMediaFiles(prev => [result, ...prev]);

      // Update upload progress
      setUploadProgress(prev => 
        prev.map(upload => 
          upload.file === file ? { ...upload, status: 'completed', result } : upload
        )
      );

      // Remove from upload progress after delay
      setTimeout(() => {
        setUploadProgress(prev => prev.filter(upload => upload.file !== file));
      }, 2000);

    } catch (error) {
      setUploadProgress(prev => 
        prev.map(upload => 
          upload.file === file ? { 
            ...upload, 
            status: 'error', 
            error: 'Error uploading file' 
          } : upload
        )
      );
    }
  };

  // =============================================================================
  // FILE MANAGEMENT
  // =============================================================================

  const handleFileDelete = async (fileId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
      return;
    }

    try {
      // Mock delete - replace with actual API call
      setMediaFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleFileEdit = (file: MediaFile) => {
    setEditingFile(file);
  };

  const saveFileEdit = async (updatedFile: MediaFile) => {
    try {
      // Mock save - replace with actual API call
      setMediaFiles(prev => 
        prev.map(file => 
          file.id === updatedFile.id ? updatedFile : file
        )
      );
      setEditingFile(null);
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    if (allowMultiSelect) {
      setSelectedFiles(prev => 
        prev.includes(fileId) 
          ? prev.filter(id => id !== fileId)
          : [...prev, fileId]
      );
    } else {
      setSelectedFiles([fileId]);
    }
  };

  // =============================================================================
  // FILTERING AND SORTING
  // =============================================================================

  const filteredFiles = React.useMemo(() => {
    let filtered = mediaFiles.filter(file => {
      // Search filter
      const matchesSearch = !searchQuery || 
        file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Type filter
      const matchesType = filterType === 'all' || 
        (filterType === 'images' && file.file_type.startsWith('image/')) ||
        (filterType === 'videos' && file.file_type.startsWith('video/')) ||
        (filterType === 'audio' && file.file_type.startsWith('audio/')) ||
        (filterType === 'documents' && file.file_type === 'application/pdf');

      // Folder filter
      const matchesFolder = file.folder_id === currentFolder;

      return matchesSearch && matchesType && matchesFolder;
    });

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.filename.localeCompare(b.filename);
          break;
        case 'date':
          comparison = new Date(a.upload_date).getTime() - new Date(b.upload_date).getTime();
          break;
        case 'size':
          comparison = a.file_size - b.file_size;
          break;
        case 'type':
          comparison = a.file_type.localeCompare(b.file_type);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [mediaFiles, searchQuery, filterType, currentFolder, sortBy, sortOrder]);

  // =============================================================================
  // DRAG AND DROP
  // =============================================================================

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    fetchMediaFiles(currentFolder);
    fetchFolders();
  }, [fetchMediaFiles, fetchFolders, currentFolder]);

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎬';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType === 'application/pdf') return '📄';
    return '📁';
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderToolbar = () => (
    <div className="mb-6 space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar archivos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los tipos</option>
            <option value="images">Imágenes</option>
            <option value="videos">Videos</option>
            <option value="audio">Audio</option>
            <option value="documents">Documentos</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split('-');
              setSortBy(sort as any);
              setSortOrder(order as any);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="date-desc">Más reciente</option>
            <option value="date-asc">Más antiguo</option>
            <option value="name-asc">Nombre A-Z</option>
            <option value="name-desc">Nombre Z-A</option>
            <option value="size-desc">Mayor tamaño</option>
            <option value="size-asc">Menor tamaño</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            📎 Subir Archivos
          </button>
          
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            📁 Nueva Carpeta
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded ${view === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            ⊞
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded ${view === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Selected files actions */}
      {selectedFiles.length > 0 && (
        <div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <span className="text-sm text-blue-700">
            {selectedFiles.length} archivo(s) seleccionado(s)
          </span>
          <div className="flex gap-2">
            {onSelectMedia && (
              <button
                onClick={() => {
                  const selected = mediaFiles.filter(file => selectedFiles.includes(file.id));
                  onSelectMedia(selected);
                }}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Usar Seleccionados
              </button>
            )}
            <button
              onClick={() => setSelectedFiles([])}
              className="px-3 py-1 border border-blue-300 text-blue-700 text-sm rounded hover:bg-white"
            >
              Deseleccionar
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderBreadcrumbs = () => {
    if (!currentFolder) return null;

    return (
      <nav className="mb-4">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <button
              onClick={() => setCurrentFolder('')}
              className="hover:text-blue-600"
            >
              📁 Raíz
            </button>
          </li>
          <li>/</li>
          <li>
            {folders.find(f => f.id === currentFolder)?.name || 'Carpeta'}
          </li>
        </ol>
      </nav>
    );
  };

  const renderFolders = () => {
    if (currentFolder) return null;

    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Carpetas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => setCurrentFolder(folder.id)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
            >
              <div className="text-2xl mb-2">📁</div>
              <div className="text-sm font-medium text-gray-900 truncate">
                {folder.name}
              </div>
              <div className="text-xs text-gray-500">
                {folder.media_count} archivos
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {filteredFiles.map(file => (
        <div
          key={file.id}
          className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
            selectedFiles.includes(file.id)
              ? 'border-blue-500 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => toggleFileSelection(file.id)}
        >
          {/* Thumbnail */}
          <div className="aspect-square bg-gray-100 flex items-center justify-center">
            {file.file_type.startsWith('image/') ? (
              <img
                src={file.url}
                alt={file.alt_text || file.filename}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-4xl">
                {getFileTypeIcon(file.file_type)}
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="p-3">
            <div className="text-sm font-medium text-gray-900 truncate mb-1">
              {file.original_filename}
            </div>
            <div className="text-xs text-gray-500">
              {formatFileSize(file.file_size)}
            </div>
            {file.duration && (
              <div className="text-xs text-gray-500">
                {formatDuration(file.duration)}
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="px-3 pb-3 flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFileEdit(file);
              }}
              className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Editar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFileDelete(file.id);
              }}
              className="flex-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Archivo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tamaño
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredFiles.map(file => (
            <tr
              key={file.id}
              className={`cursor-pointer hover:bg-gray-50 ${
                selectedFiles.includes(file.id) ? 'bg-blue-50' : ''
              }`}
              onClick={() => toggleFileSelection(file.id)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">
                    {getFileTypeIcon(file.file_type)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {file.original_filename}
                    </div>
                    {file.description && (
                      <div className="text-sm text-gray-500">
                        {file.description}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {file.file_type}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatFileSize(file.file_size)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(file.upload_date).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileEdit(file);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileDelete(file.id);
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderUploadProgress = () => {
    if (uploadProgress.length === 0) return null;

    return (
      <div className="mb-6 space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Subiendo archivos...</h3>
        {uploadProgress.map((upload, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-900">{upload.file.name}</span>
              <span className="text-xs text-gray-500">
                {upload.status === 'uploading' && `${upload.progress}%`}
                {upload.status === 'processing' && 'Procesando...'}
                {upload.status === 'completed' && '✅ Completado'}
                {upload.status === 'error' && '❌ Error'}
              </span>
            </div>
            
            {upload.status === 'uploading' && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
            )}
            
            {upload.status === 'processing' && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full animate-pulse" />
              </div>
            )}
            
            {upload.error && (
              <div className="text-sm text-red-600 mt-1">{upload.error}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // =============================================================================
  // MODALS
  // =============================================================================

  const renderUploadModal = () => (
    showUploadModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Subir Archivos</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
            >
              <div className="text-4xl mb-4">📁</div>
              <p className="text-gray-600 mb-2">
                Arrastra archivos aquí o haz clic para seleccionar
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Máximo {maxFileSize / 1024 / 1024}MB por archivo
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={acceptedTypes.join(',')}
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Seleccionar Archivos
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  const renderFileEditModal = () => (
    editingFile && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Editar Archivo</h3>
              <button
                onClick={() => setEditingFile(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de archivo
                </label>
                <input
                  type="text"
                  value={editingFile.original_filename}
                  onChange={(e) => setEditingFile({
                    ...editingFile,
                    original_filename: e.target.value
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={editingFile.description || ''}
                  onChange={(e) => setEditingFile({
                    ...editingFile,
                    description: e.target.value
                  })}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Texto alternativo
                </label>
                <input
                  type="text"
                  value={editingFile.alt_text || ''}
                  onChange={(e) => setEditingFile({
                    ...editingFile,
                    alt_text: e.target.value
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe la imagen para accesibilidad..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Etiquetas
                </label>
                <input
                  type="text"
                  value={editingFile.tags.join(', ')}
                  onChange={(e) => setEditingFile({
                    ...editingFile,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="etiqueta1, etiqueta2, etiqueta3"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={editingFile.is_public}
                  onChange={(e) => setEditingFile({
                    ...editingFile,
                    is_public: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                  Archivo público (visible para estudiantes)
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingFile(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => saveFileEdit(editingFile)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Guardar Cambios
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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Biblioteca de Media</h1>
        <p className="text-gray-600">
          Gestiona todos tus archivos multimedia
        </p>
      </div>

      {/* Breadcrumbs */}
      {renderBreadcrumbs()}

      {/* Toolbar */}
      {renderToolbar()}

      {/* Upload Progress */}
      {renderUploadProgress()}

      {/* Folders */}
      {renderFolders()}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Files */}
      {!loading && (
        <>
          {view === 'grid' ? renderGridView() : renderListView()}
          
          {filteredFiles.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📁</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron archivos
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'Intenta con diferentes términos de búsqueda' : 'Sube tu primer archivo para comenzar'}
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                📎 Subir Archivos
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {renderUploadModal()}
      {renderFileEditModal()}
    </div>
  );
};

export default MediaLibrary;