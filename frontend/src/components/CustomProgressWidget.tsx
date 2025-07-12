import React, { useState, useEffect, useCallback } from 'react';
import { Settings, BarChart3, Calendar, Target, Zap, Award } from 'lucide-react';

interface WidgetConfig {
  id: string;
  type: 'circular' | 'linear' | 'chart' | 'calendar' | 'goals';
  title: string;
  visible: boolean;
  size: 'small' | 'medium' | 'large';
  color: string;
  position: number;
}

interface CustomProgressWidgetProps {
  studentId: string;
  editable?: boolean;
}

const CustomProgressWidget: React.FC<CustomProgressWidgetProps> = ({ studentId, editable = false }) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [editMode, setEditMode] = useState(false);

  const initializeWidgets = useCallback(() => {
    const defaultWidgets: WidgetConfig[] = [
      {
        id: 'overall_progress',
        type: 'circular',
        title: 'Progreso General',
        visible: true,
        size: 'large',
        color: 'blue',
        position: 1
      },
      {
        id: 'weekly_goals',
        type: 'goals',
        title: 'Metas Semanales',
        visible: true,
        size: 'medium',
        color: 'green',
        position: 2
      },
      {
        id: 'learning_streak',
        type: 'calendar',
        title: 'Racha de Aprendizaje',
        visible: true,
        size: 'medium',
        color: 'orange',
        position: 3
      },
      {
        id: 'performance_chart',
        type: 'chart',
        title: 'Rendimiento Semanal',
        visible: true,
        size: 'large',
        color: 'purple',
        position: 4
      },
      {
        id: 'speed_metrics',
        type: 'linear',
        title: 'Velocidad de Aprendizaje',
        visible: false,
        size: 'small',
        color: 'indigo',
        position: 5
      }
    ];
    
    setWidgets(defaultWidgets);
  }, []); // No dependencies needed as this is static data

  useEffect(() => {
    initializeWidgets();
  }, [initializeWidgets, studentId]);

  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, visible: !widget.visible }
        : widget
    ));
  };

  const updateWidgetConfig = (widgetId: string, updates: Partial<WidgetConfig>) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, ...updates }
        : widget
    ));
  };

  const renderCircularProgress = (widget: WidgetConfig) => {
    const progress = 73; // Simulado
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className={`glass-card rounded-2xl p-6 ${widget.size === 'large' ? 'col-span-2' : ''}`}>
        <h3 className="text-lg font-bold text-gray-800 mb-4">{widget.title}</h3>
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="64"
                cy="64"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`text-${widget.color}-600 transition-all duration-1000`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-800">{progress}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLinearProgress = (widget: WidgetConfig) => {
    const metrics = [
      { label: 'Velocidad de Lectura', value: 85, unit: 'wpm' },
      { label: 'Comprensión', value: 92, unit: '%' },
      { label: 'Retención', value: 78, unit: '%' }
    ];

    return (
      <div className={`glass-card rounded-2xl p-6 ${widget.size === 'large' ? 'col-span-2' : ''}`}>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-yellow-600" />
          {widget.title}
        </h3>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                <span>{metric.label}</span>
                <span>{metric.value}{metric.unit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 bg-${widget.color}-500 rounded-full transition-all duration-1000`}
                  style={{ width: `${metric.value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGoalsWidget = (widget: WidgetConfig) => {
    const goals = [
      { title: 'Completar 5 lecciones', progress: 80, current: 4, target: 5 },
      { title: 'Evaluación perfecta', progress: 100, current: 1, target: 1 },
      { title: 'Estudiar 3 horas', progress: 67, current: 2, target: 3 }
    ];

    return (
      <div className={`glass-card rounded-2xl p-6 ${widget.size === 'large' ? 'col-span-2' : ''}`}>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-green-600" />
          {widget.title}
        </h3>
        <div className="space-y-3">
          {goals.map((goal, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-800">{goal.title}</span>
                <span className="text-xs text-gray-600">{goal.current}/{goal.target}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 bg-${widget.color}-500 rounded-full transition-all duration-500`}
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCalendarWidget = (widget: WidgetConfig) => {
    const days = Array.from({ length: 7 }, (_, i) => ({
      day: ['L', 'M', 'X', 'J', 'V', 'S', 'D'][i],
      completed: i < 5 // Simulado
    }));

    return (
      <div className={`glass-card rounded-2xl p-6 ${widget.size === 'large' ? 'col-span-2' : ''}`}>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-orange-600" />
          {widget.title}
        </h3>
        <div className="flex justify-center mb-4">
          <span className="text-3xl">🔥</span>
        </div>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {days.map((day, index) => (
            <div key={index} className="text-center">
              <p className="text-xs text-gray-600 mb-1">{day.day}</p>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                day.completed 
                  ? `bg-${widget.color}-500 text-white` 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-800">5 días</p>
          <p className="text-sm text-gray-600">Racha actual</p>
        </div>
      </div>
    );
  };

  const renderChartWidget = (widget: WidgetConfig) => {
    const data = [65, 78, 85, 72, 90, 88, 92]; // Simulado

    return (
      <div className={`glass-card rounded-2xl p-6 ${widget.size === 'large' ? 'col-span-2' : ''}`}>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
          {widget.title}
        </h3>
        <div className="flex items-end justify-between h-32 gap-2">
          {data.map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className={`w-full bg-${widget.color}-500 rounded-t transition-all duration-1000`}
                style={{ height: `${value}%` }}
              ></div>
              <span className="text-xs text-gray-600 mt-1">{['L', 'M', 'X', 'J', 'V', 'S', 'D'][index]}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <p className="text-lg font-bold text-gray-800">85%</p>
          <p className="text-sm text-gray-600">Promedio semanal</p>
        </div>
      </div>
    );
  };

  const renderWidget = (widget: WidgetConfig) => {
    if (!widget.visible) return null;

    switch (widget.type) {
      case 'circular':
        return renderCircularProgress(widget);
      case 'linear':
        return renderLinearProgress(widget);
      case 'goals':
        return renderGoalsWidget(widget);
      case 'calendar':
        return renderCalendarWidget(widget);
      case 'chart':
        return renderChartWidget(widget);
      default:
        return null;
    }
  };

  const visibleWidgets = widgets.filter(w => w.visible).sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      {/* Header con controles de personalización */}
      {editable && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-blue-600" />
              Personalizar Dashboard
            </h2>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                editMode 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {editMode ? 'Guardar Cambios' : 'Editar Widgets'}
            </button>
          </div>

          {editMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {widgets.map((widget) => (
                <div key={widget.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-800">{widget.title}</span>
                    <button
                      onClick={() => toggleWidgetVisibility(widget.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        widget.visible 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {widget.visible ? 'Visible' : 'Oculto'}
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-600">Tamaño:</label>
                      <select 
                        value={widget.size}
                        onChange={(e) => updateWidgetConfig(widget.id, { size: e.target.value as any })}
                        className="w-full text-xs border rounded px-2 py-1"
                      >
                        <option value="small">Pequeño</option>
                        <option value="medium">Mediano</option>
                        <option value="large">Grande</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-600">Color:</label>
                      <select 
                        value={widget.color}
                        onChange={(e) => updateWidgetConfig(widget.id, { color: e.target.value })}
                        className="w-full text-xs border rounded px-2 py-1"
                      >
                        <option value="blue">Azul</option>
                        <option value="green">Verde</option>
                        <option value="purple">Morado</option>
                        <option value="orange">Naranja</option>
                        <option value="indigo">Índigo</option>
                        <option value="red">Rojo</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid de widgets personalizables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleWidgets.map((widget) => (
          <div key={widget.id} className={widget.size === 'large' ? 'lg:col-span-2' : ''}>
            {renderWidget(widget)}
          </div>
        ))}
      </div>

      {/* Widget de estadísticas rápidas */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Award className="h-5 w-5 mr-2 text-yellow-600" />
          Resumen de Progreso Personalizado
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <p className="text-2xl font-bold text-blue-600">8.5</p>
            <p className="text-sm text-gray-600">Nota Promedio</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl">
            <p className="text-2xl font-bold text-green-600">23h</p>
            <p className="text-sm text-gray-600">Tiempo Total</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
            <p className="text-2xl font-bold text-purple-600">15</p>
            <p className="text-sm text-gray-600">Badges</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl">
            <p className="text-2xl font-bold text-orange-600">7</p>
            <p className="text-sm text-gray-600">Días Racha</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomProgressWidget;