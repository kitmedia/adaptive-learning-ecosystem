/**
 * Monitoring Dashboard Component
 * Adaptive Learning Ecosystem - EbroValley Digital
 * Real-time monitoring and alerting dashboard
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Server,
  Wifi,
  Database,
  Shield,
  Download,
  RefreshCw
} from 'lucide-react';
import { monitoringService } from '../services/monitoring.service';
import { logger } from '../services/logger.service';

interface MonitoringDashboardProps {
  isVisible?: boolean;
  position?: 'floating' | 'embedded';
  enableRealtimeUpdates?: boolean;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  isVisible = true,
  position = 'floating',
  enableRealtimeUpdates = true
}) => {
  const [metrics, setMetrics] = useState(monitoringService.getMetrics());
  const [alerts, setAlerts] = useState(monitoringService.getAlerts());
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'alerts' | 'logs'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logs, setLogs] = useState(logger.getLogs().slice(-20));
  const updateInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enableRealtimeUpdates) return;

    // Subscribe to monitoring updates
    const unsubscribe = monitoringService.subscribe((newMetrics) => {
      setMetrics(newMetrics);
      setAlerts(monitoringService.getAlerts());
      setLogs(logger.getLogs().slice(-20));
    });

    // Start real-time updates
    updateInterval.current = setInterval(() => {
      setMetrics(monitoringService.getMetrics());
      setAlerts(monitoringService.getAlerts());
      setLogs(logger.getLogs().slice(-20));
    }, 5000);

    return () => {
      unsubscribe();
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [enableRealtimeUpdates]);

  if (!isVisible) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Force refresh metrics
    setMetrics(monitoringService.getMetrics());
    setAlerts(monitoringService.getAlerts());
    setLogs(logger.getLogs().slice(-20));
    
    logger.info('system', 'Monitoring dashboard refreshed');
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleExportLogs = () => {
    const logData = logger.exportLogs();
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    logger.info('system', 'Logs exported');
  };

  const getHealthStatus = () => {
    const criticalAlerts = alerts.filter(a => a.type === 'critical' && !a.resolved).length;
    const errorAlerts = alerts.filter(a => a.type === 'error' && !a.resolved).length;
    
    if (criticalAlerts > 0) return { status: 'critical', color: 'text-red-600', bg: 'bg-red-100' };
    if (errorAlerts > 0) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'healthy', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const formatMetric = (value: number, unit: string = '') => {
    if (unit === 'ms' && value < 1000) return `${Math.round(value)}ms`;
    if (unit === 'ms' && value >= 1000) return `${(value / 1000).toFixed(1)}s`;
    if (unit === '%') return `${value.toFixed(1)}%`;
    if (unit === '/10') return `${value.toFixed(1)}/10`;
    return `${value.toFixed(1)}${unit}`;
  };

  const getMetricTrend = (current: number, threshold: number) => {
    if (current <= threshold * 0.8) return { icon: TrendingUp, color: 'text-green-500' };
    if (current <= threshold) return { icon: Clock, color: 'text-yellow-500' };
    return { icon: TrendingDown, color: 'text-red-500' };
  };

  const health = getHealthStatus();

  // Floating dashboard
  if (position === 'floating') {
    return (
      <div className="fixed bottom-4 right-4 z-50 font-mono text-sm">
        {/* Collapsed View */}
        {!isExpanded && (
          <div
            onClick={() => setIsExpanded(true)}
            className={`
              cursor-pointer ${health.bg} rounded-lg p-3 backdrop-blur-sm 
              border border-gray-300 hover:shadow-lg transition-all
              flex items-center gap-2 shadow-md
            `}
          >
            <div className={`w-3 h-3 rounded-full ${
              health.status === 'healthy' ? 'bg-green-500' : 
              health.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            } animate-pulse`}></div>
            <span className={`font-semibold ${health.color}`}>
              {health.status.toUpperCase()}
            </span>
            <Activity className="h-4 w-4 text-gray-600" />
          </div>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <div className="bg-white rounded-lg p-4 backdrop-blur-sm border border-gray-300 shadow-xl min-w-[400px] max-w-[500px] max-h-[600px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Sistema Monitor</span>
                <div className={`w-2 h-2 rounded-full ${
                  health.status === 'healthy' ? 'bg-green-500' : 
                  health.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                } animate-pulse`}></div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Actualizar"
                >
                  <RefreshCw className={`h-4 w-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
              {(['overview', 'performance', 'alerts', 'logs'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    selectedTab === tab
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {/* Overview Tab */}
              {selectedTab === 'overview' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-gray-700">Carga</span>
                      </div>
                      <div className="font-bold text-lg text-blue-700">
                        {formatMetric(metrics.pageLoadTime, 'ms')}
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-gray-700">Satisfacción</span>
                      </div>
                      <div className="font-bold text-lg text-green-700">
                        {formatMetric(metrics.userSatisfactionScore, '/10')}
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Wifi className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-medium text-gray-700">API</span>
                      </div>
                      <div className="font-bold text-lg text-purple-700">
                        {formatMetric(metrics.apiResponseTime, 'ms')}
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Database className="h-4 w-4 text-orange-600" />
                        <span className="text-xs font-medium text-gray-700">Cache</span>
                      </div>
                      <div className="font-bold text-lg text-orange-700">
                        {formatMetric(metrics.cacheHitRate, '%')}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">Estado General</span>
                      <span className={`text-xs font-bold ${health.color}`}>
                        {health.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Alertas activas: {alerts.filter(a => !a.resolved).length} | 
                      Sesión: {logger.getSessionId().split('_')[1]}
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Tab */}
              {selectedTab === 'performance' && (
                <div className="space-y-3">
                  {[
                    { label: 'Tiempo de Carga', value: metrics.pageLoadTime, threshold: 3000, unit: 'ms' },
                    { label: 'Tiempo de Render', value: metrics.renderTime, threshold: 1000, unit: 'ms' },
                    { label: 'Respuesta API', value: metrics.apiResponseTime, threshold: 2000, unit: 'ms' },
                    { label: 'Tasa de Errores', value: metrics.errorRate, threshold: 5, unit: '%' },
                    { label: 'Tasa de Rebote', value: metrics.bounceRate, threshold: 40, unit: '%' },
                    { label: 'Engagement', value: metrics.userEngagement, threshold: 5, unit: '/min' }
                  ].map((metric) => {
                    const trend = getMetricTrend(metric.value, metric.threshold);
                    const TrendIcon = trend.icon;
                    
                    return (
                      <div key={metric.label} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">{metric.label}</span>
                          <div className="flex items-center gap-1">
                            <TrendIcon className={`h-3 w-3 ${trend.color}`} />
                            <span className="font-bold text-sm">
                              {formatMetric(metric.value, metric.unit)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-1 bg-gray-200 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full transition-all duration-500 ${
                              metric.value <= metric.threshold * 0.8 ? 'bg-green-500' :
                              metric.value <= metric.threshold ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ 
                              width: `${Math.min(100, (metric.value / (metric.threshold * 1.2)) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Alerts Tab */}
              {selectedTab === 'alerts' && (
                <div className="space-y-2">
                  {alerts.filter(a => !a.resolved).length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p className="text-sm">No hay alertas activas</p>
                    </div>
                  ) : (
                    alerts.filter(a => !a.resolved).map((alert) => (
                      <div
                        key={alert.id}
                        className={`rounded-lg p-3 border-l-4 ${
                          alert.type === 'critical' ? 'bg-red-50 border-red-500' :
                          alert.type === 'error' ? 'bg-orange-50 border-orange-500' :
                          alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                          'bg-blue-50 border-blue-500'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                            alert.type === 'critical' ? 'text-red-600' :
                            alert.type === 'error' ? 'text-orange-600' :
                            alert.type === 'warning' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`} />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-900">{alert.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          <button
                            onClick={() => monitoringService.resolveAlert(alert.id)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Logs Tab */}
              {selectedTab === 'logs' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-700">Logs Recientes</span>
                    <button
                      onClick={handleExportLogs}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                    >
                      <Download className="h-3 w-3" />
                      Exportar
                    </button>
                  </div>
                  
                  {logs.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-xs">No hay logs disponibles</p>
                    </div>
                  ) : (
                    logs.slice().reverse().map((log) => (
                      <div key={log.id} className="bg-gray-50 rounded p-2 text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-1 rounded text-xs font-mono ${
                            log.level === 'error' || log.level === 'critical' ? 'bg-red-100 text-red-700' :
                            log.level === 'warn' ? 'bg-yellow-100 text-yellow-700' :
                            log.level === 'info' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {log.level.toUpperCase()}
                          </span>
                          <span className="text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="text-gray-600 text-xs">
                            [{log.category}]
                          </span>
                        </div>
                        <p className="text-gray-800 text-xs">{log.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Embedded dashboard (for full page view)
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          Sistema de Monitoreo
        </h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Content would be similar to floating version but with more space */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overview metrics */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Métricas Generales</h3>
          {/* Similar content to floating dashboard but with more detail */}
        </div>

        {/* Performance charts */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Rendimiento</h3>
          {/* Performance visualization */}
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;