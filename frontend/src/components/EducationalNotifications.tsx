import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Info, Lightbulb, Target, Clock, Award, BookOpen } from 'lucide-react';

interface Notification {
  id: string;
  type: 'achievement' | 'reminder' | 'tip' | 'deadline' | 'milestone' | 'social';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  actionText?: string;
  actionUrl?: string;
  relatedCourse?: string;
}

interface NotificationSettings {
  achievements: boolean;
  reminders: boolean;
  tips: boolean;
  deadlines: boolean;
  social: boolean;
  sound: boolean;
  email: boolean;
}

interface EducationalNotificationsProps {
  studentId: string;
  compact?: boolean;
}

const EducationalNotifications: React.FC<EducationalNotificationsProps> = ({ studentId, compact = false }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    achievements: true,
    reminders: true,
    tips: true,
    deadlines: true,
    social: true,
    sound: false,
    email: false
  });
  const [showSettings, setShowSettings] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    generateEducationalNotifications();
    const interval = setInterval(generateEducationalNotifications, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [studentId]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const generateEducationalNotifications = () => {
    const now = new Date();
    const educationalNotifications: Notification[] = [
      {
        id: 'achievement_1',
        type: 'achievement',
        title: '🏆 ¡Nuevo Badge Desbloqueado!',
        message: 'Has ganado el badge "Aprendiz Constante" por estudiar 5 días seguidos.',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000),
        read: false,
        priority: 'high',
        actionable: true,
        actionText: 'Ver Badge',
        actionUrl: '/gamification'
      },
      {
        id: 'reminder_1',
        type: 'reminder',
        title: '📚 Recordatorio de Estudio',
        message: 'Es tu hora de estudio preferida. ¿Listos para la lección de Machine Learning?',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000),
        read: false,
        priority: 'medium',
        actionable: true,
        actionText: 'Comenzar Lección',
        relatedCourse: 'Introducción a IA'
      },
      {
        id: 'tip_1',
        type: 'tip',
        title: '💡 Consejo de Aprendizaje',
        message: 'Basado en tu patrón de estudio, te recomendamos sesiones de 25 minutos con descansos de 5 minutos (Técnica Pomodoro).',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000),
        read: true,
        priority: 'low',
        actionable: true,
        actionText: 'Configurar Timer'
      },
      {
        id: 'milestone_1',
        type: 'milestone',
        title: '🎯 Hito Alcanzado',
        message: '¡Felicidades! Has completado el 75% del curso "Introducción a IA Adaptativa".',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        read: false,
        priority: 'high',
        actionable: true,
        actionText: 'Ver Progreso',
        relatedCourse: 'Introducción a IA'
      },
      {
        id: 'deadline_1',
        type: 'deadline',
        title: '⏰ Evaluación Próxima',
        message: 'Tu evaluación de "Desarrollo Web Moderno" es en 2 días. ¿Ya revisaste los materiales?',
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        read: true,
        priority: 'high',
        actionable: true,
        actionText: 'Repasar Materiales',
        relatedCourse: 'Desarrollo Web'
      },
      {
        id: 'social_1',
        type: 'social',
        title: '👥 Actividad Social',
        message: 'María López te invitó a unirte al grupo de estudio "React Masters". ¡3 miembros activos!',
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        read: false,
        priority: 'medium',
        actionable: true,
        actionText: 'Ver Invitación'
      }
    ];

    setNotifications(educationalNotifications);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <Award className="h-5 w-5 text-yellow-600" />;
      case 'reminder':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'tip':
        return <Lightbulb className="h-5 w-5 text-green-600" />;
      case 'deadline':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'milestone':
        return <Target className="h-5 w-5 text-purple-600" />;
      case 'social':
        return <BookOpen className="h-5 w-5 text-indigo-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  };

  if (compact) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-blue-600" />
            Notificaciones
          </h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {notifications.slice(0, 5).map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <div className="p-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimestamp(notification.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {notifications.length > 5 && (
          <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 font-semibold">
            Ver todas las notificaciones →
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del sistema de notificaciones */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Bell className="h-6 w-6 mr-2 text-blue-600" />
            Centro de Notificaciones Educativas
          </h2>
          <div className="flex gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-blue-100 text-blue-600 px-4 py-2 rounded-xl font-semibold hover:bg-blue-200 transition-colors"
              >
                Marcar todas como leídas
              </button>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Configuración
            </button>
          </div>
        </div>

        {/* Resumen de notificaciones */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
            <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
            <p className="text-sm text-gray-600">Sin leer</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
            <p className="text-2xl font-bold text-green-600">
              {notifications.filter(n => n.type === 'achievement').length}
            </p>
            <p className="text-sm text-gray-600">Logros</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 text-center border border-yellow-200">
            <p className="text-2xl font-bold text-yellow-600">
              {notifications.filter(n => n.type === 'reminder').length}
            </p>
            <p className="text-sm text-gray-600">Recordatorios</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
            <p className="text-2xl font-bold text-purple-600">
              {notifications.filter(n => n.actionable).length}
            </p>
            <p className="text-sm text-gray-600">Acciones</p>
          </div>
        </div>
      </div>

      {/* Configuración de notificaciones */}
      {showSettings && (
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-gray-50 to-blue-50">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Configuración de Notificaciones</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Tipos de Notificaciones</h4>
              {Object.entries(settings).slice(0, 5).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <span className="text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, [key]: !value }))}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      value ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}></div>
                  </button>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Preferencias de Entrega</h4>
              {Object.entries(settings).slice(5).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <span className="text-gray-700 capitalize">{key}</span>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, [key]: !value }))}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      value ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lista de notificaciones */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Notificaciones Recientes</h3>
        
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.01] ${
                !notification.read 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : getPriorityColor(notification.priority)
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-2 bg-white rounded-xl">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-gray-800">{notification.title}</h4>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                        notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {notification.priority}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{notification.message}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{formatTimestamp(notification.timestamp)}</span>
                        {notification.relatedCourse && (
                          <span className="bg-gray-100 px-2 py-1 rounded-full">
                            📚 {notification.relatedCourse}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {notification.actionable && notification.actionText && (
                          <button className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors">
                            {notification.actionText}
                          </button>
                        )}
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Marcar como leída"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Eliminar notificación"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No tienes notificaciones pendientes</p>
            <p className="text-sm text-gray-500 mt-2">Las nuevas notificaciones aparecerán aquí</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EducationalNotifications;