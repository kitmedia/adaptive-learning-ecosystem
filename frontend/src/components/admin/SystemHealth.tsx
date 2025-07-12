/**
 * System Health Monitoring - Real-time Infrastructure Monitoring
 * Adaptive Learning Ecosystem - EbroValley Digital
 * 
 * Monitoreo completo de salud del sistema con métricas en tiempo real
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../ui/loading-spinner';
import { useAuth } from '../../hooks/useAuth';
import { useMonitoring } from '../../hooks/useMonitoring';
import {
  Activity,
  Server,
  Database,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Eye,
  Settings,
  Download,
  Zap,
  Shield,
  Users,
  BarChart3,
  FileText,
  Terminal,
  Gauge,
  Timer,
  Signal,
  Power,
  Thermometer,
  Network
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  uptime: string;
  responseTime: number;
  lastCheck: string;
  endpoint: string;
  version: string;
  dependencies: string[];
  metrics: {
    requests: number;
    errors: number;
    avgResponseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

interface SystemMetrics {
  overall: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: string;
    lastIncident: string | null;
    activeSessions: number;
    totalRequests: number;
    errorRate: number;
  };
  infrastructure: {
    cpu: {
      usage: number;
      cores: number;
      load: number[];
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    disk: {
      used: number;
      total: number;
      percentage: number;
    };
    network: {
      bandwidth: number;
      latency: number;
      packetsIn: number;
      packetsOut: number;
    };
  };
  database: {
    status: 'connected' | 'disconnected' | 'slow';
    connections: number;
    maxConnections: number;
    queryTime: number;
    size: number;
    backup: {
      lastBackup: string;
      status: 'success' | 'failed' | 'running';
    };
  };
  cache: {
    status: 'connected' | 'disconnected';
    hitRate: number;
    memoryUsage: number;
    keyCount: number;
  };
  security: {
    failedLogins: number;
    blockedIPs: number;
    activeThreat: boolean;
    lastScan: string;
  };
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  service: string;
  acknowledged: boolean;
  details: {
    metric?: string;
    threshold?: number;
    currentValue?: number;
    duration?: string;
  };
}

const SystemHealth: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { systemMetrics } = useMonitoring();
  
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceStatus | null>(null);
  const [showServiceDetails, setShowServiceDetails] = useState(false);

  useEffect(() => {
    loadSystemHealth();
    
    // Auto-refresh every 10 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadSystemHealth, 10000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadSystemHealth = async () => {
    try {
      setIsLoading(true);
      
      // In real implementation, these would be separate API calls
      const [servicesRes, metricsRes, alertsRes] = await Promise.allSettled([
        fetch('/api/monitoring/services', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }),
        fetch('/api/monitoring/metrics', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }),
        fetch('/api/monitoring/alerts', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
      ]);

      // Mock data for demonstration
      const mockServices: ServiceStatus[] = [
        {
          name: 'API Gateway',
          status: 'healthy',
          uptime: '99.98%',
          responseTime: 45,
          lastCheck: new Date().toISOString(),
          endpoint: '/api/health',
          version: '1.2.4',
          dependencies: ['Authentication', 'Analytics'],
          metrics: {
            requests: 154820,
            errors: 12,
            avgResponseTime: 45,
            memoryUsage: 68,
            cpuUsage: 23
          }
        },
        {
          name: 'Authentication Service',
          status: 'healthy',
          uptime: '99.95%',
          responseTime: 28,
          lastCheck: new Date().toISOString(),
          endpoint: '/auth/health',
          version: '2.1.0',
          dependencies: ['Database', 'Cache'],
          metrics: {
            requests: 89456,
            errors: 5,
            avgResponseTime: 28,
            memoryUsage: 45,
            cpuUsage: 15
          }
        },
        {
          name: 'Analytics Service',
          status: 'warning',
          uptime: '99.87%',
          responseTime: 156,
          lastCheck: new Date().toISOString(),
          endpoint: '/analytics/health',
          version: '1.8.2',
          dependencies: ['Database', 'Cache'],
          metrics: {
            requests: 67234,
            errors: 23,
            avgResponseTime: 156,
            memoryUsage: 78,
            cpuUsage: 45
          }
        },
        {
          name: 'AI Tutor Service',
          status: 'healthy',
          uptime: '99.92%',
          responseTime: 89,
          lastCheck: new Date().toISOString(),
          endpoint: '/ai-tutor/health',
          version: '3.0.1',
          dependencies: ['ML Models', 'Cache'],
          metrics: {
            requests: 34567,
            errors: 8,
            avgResponseTime: 89,
            memoryUsage: 82,
            cpuUsage: 67
          }
        },
        {
          name: 'Content Service',
          status: 'healthy',
          uptime: '99.94%',
          responseTime: 34,
          lastCheck: new Date().toISOString(),
          endpoint: '/content/health',
          version: '1.5.3',
          dependencies: ['Database', 'File Storage'],
          metrics: {
            requests: 123456,
            errors: 15,
            avgResponseTime: 34,
            memoryUsage: 56,
            cpuUsage: 28
          }
        },
        {
          name: 'Progress Tracking',
          status: 'healthy',
          uptime: '99.96%',
          responseTime: 41,
          lastCheck: new Date().toISOString(),
          endpoint: '/progress/health',
          version: '2.2.1',
          dependencies: ['Database', 'Analytics'],
          metrics: {
            requests: 98765,
            errors: 7,
            avgResponseTime: 41,
            memoryUsage: 62,
            cpuUsage: 31
          }
        },
        {
          name: 'Recommendation Engine',
          status: 'critical',
          uptime: '97.23%',
          responseTime: 2345,
          lastCheck: new Date().toISOString(),
          endpoint: '/recommendations/health',
          version: '1.1.8',
          dependencies: ['AI Models', 'Analytics'],
          metrics: {
            requests: 45678,
            errors: 156,
            avgResponseTime: 2345,
            memoryUsage: 95,
            cpuUsage: 87
          }
        }
      ];

      const mockMetrics: SystemMetrics = {
        overall: {
          status: 'warning',
          uptime: '99.87%',
          lastIncident: '2025-01-11T14:23:00Z',
          activeSessions: 2847,
          totalRequests: 1456789,
          errorRate: 0.08
        },
        infrastructure: {
          cpu: {
            usage: 45,
            cores: 8,
            load: [2.1, 1.8, 2.4]
          },
          memory: {
            used: 12.4,
            total: 16,
            percentage: 77.5
          },
          disk: {
            used: 245,
            total: 500,
            percentage: 49
          },
          network: {
            bandwidth: 125.6,
            latency: 23,
            packetsIn: 156789,
            packetsOut: 142356
          }
        },
        database: {
          status: 'connected',
          connections: 45,
          maxConnections: 100,
          queryTime: 12.5,
          size: 2.8,
          backup: {
            lastBackup: '2025-01-12T02:00:00Z',
            status: 'success'
          }
        },
        cache: {
          status: 'connected',
          hitRate: 94.2,
          memoryUsage: 68,
          keyCount: 15634
        },
        security: {
          failedLogins: 23,
          blockedIPs: 7,
          activeThreat: false,
          lastScan: '2025-01-12T01:00:00Z'
        }
      };

      const mockAlerts: Alert[] = [
        {
          id: '1',
          severity: 'critical',
          title: 'Recommendation Engine Down',
          message: 'El servicio de recomendaciones ha excedido el tiempo de respuesta límite',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          service: 'Recommendation Engine',
          acknowledged: false,
          details: {
            metric: 'Response Time',
            threshold: 500,
            currentValue: 2345,
            duration: '15 minutos'
          }
        },
        {
          id: '2',
          severity: 'warning',
          title: 'High Memory Usage',
          message: 'Analytics Service está usando más del 75% de memoria disponible',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          service: 'Analytics Service',
          acknowledged: false,
          details: {
            metric: 'Memory Usage',
            threshold: 75,
            currentValue: 78,
            duration: '30 minutos'
          }
        },
        {
          id: '3',
          severity: 'info',
          title: 'Backup Completed',
          message: 'Backup automático de base de datos completado exitosamente',
          timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
          service: 'Database',
          acknowledged: true,
          details: {}
        }
      ];

      setServices(mockServices);
      setMetrics(mockMetrics);
      setAlerts(mockAlerts);
      
    } catch (error) {
      console.error('Error loading system health:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      case 'offline': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'offline': return <XCircle className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const formatBytes = (bytes: number) => {
    return `${bytes.toFixed(1)} GB`;
  };

  const formatUptime = (uptime: string) => {
    return uptime;
  };

  const getPerformanceColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No se pudieron cargar las métricas del sistema</p>
        <Button onClick={loadSystemHealth} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            🏥 Monitor de Salud del Sistema
          </h2>
          <p className="text-sm text-gray-600">
            Monitoreo en tiempo real de infraestructura y servicios
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge className={getStatusColor(metrics.overall.status)}>
            <Activity className="h-3 w-3 mr-1" />
            Sistema {metrics.overall.status === 'healthy' ? 'Saludable' : 
                   metrics.overall.status === 'warning' ? 'Advertencia' : 'Crítico'}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-300' : ''}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          
          <Button size="sm" onClick={loadSystemHealth}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uptime General</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.overall.uptime}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Últimas 30 días
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sesiones Activas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.overall.activeSessions.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  En tiempo real
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Requests Totales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(metrics.overall.totalRequests / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Hoy
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Error</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(
                  metrics.overall.errorRate,
                  { warning: 0.1, critical: 0.5 }
                )}`}>
                  {metrics.overall.errorRate.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Últimas 24h
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>🖥️ Métricas de Infraestructura</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* CPU Usage */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle 
                    cx="48" cy="48" r="40" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    className="text-gray-200"
                  />
                  <circle 
                    cx="48" cy="48" r="40" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={`${(metrics.infrastructure.cpu.usage / 100) * 251.3} 251.3`}
                    className={getPerformanceColor(
                      metrics.infrastructure.cpu.usage,
                      { warning: 70, critical: 85 }
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">
                    {metrics.infrastructure.cpu.usage}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Cpu className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">CPU</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.infrastructure.cpu.cores} cores
              </p>
            </div>

            {/* Memory Usage */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle 
                    cx="48" cy="48" r="40" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    className="text-gray-200"
                  />
                  <circle 
                    cx="48" cy="48" r="40" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={`${(metrics.infrastructure.memory.percentage / 100) * 251.3} 251.3`}
                    className={getPerformanceColor(
                      metrics.infrastructure.memory.percentage,
                      { warning: 75, critical: 90 }
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">
                    {metrics.infrastructure.memory.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <MemoryStick className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">RAM</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatBytes(metrics.infrastructure.memory.used)} / {formatBytes(metrics.infrastructure.memory.total)}
              </p>
            </div>

            {/* Disk Usage */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle 
                    cx="48" cy="48" r="40" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    className="text-gray-200"
                  />
                  <circle 
                    cx="48" cy="48" r="40" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={`${(metrics.infrastructure.disk.percentage / 100) * 251.3} 251.3`}
                    className={getPerformanceColor(
                      metrics.infrastructure.disk.percentage,
                      { warning: 80, critical: 95 }
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">
                    {metrics.infrastructure.disk.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <HardDrive className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">Disco</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatBytes(metrics.infrastructure.disk.used)} / {formatBytes(metrics.infrastructure.disk.total)}
              </p>
            </div>

            {/* Network */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                  <Network className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Wifi className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">Red</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.infrastructure.network.latency}ms latencia
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>⚙️ Estado de Microservicios</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {services.map((service) => (
              <div
                key={service.name}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedService(service);
                  setShowServiceDetails(true);
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <h4 className="font-medium text-gray-900">{service.name}</h4>
                      <p className="text-sm text-gray-600">v{service.version}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(service.status)}>
                    {service.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Uptime</p>
                    <p className="font-medium">{service.uptime}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Response</p>
                    <p className="font-medium">{service.responseTime}ms</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Requests</p>
                    <p className="font-medium">{service.metrics.requests.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Cpu className="h-3 w-3" />
                    <span>CPU: {service.metrics.cpuUsage}%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MemoryStick className="h-3 w-3" />
                    <span>RAM: {service.metrics.memoryUsage}%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <XCircle className="h-3 w-3" />
                    <span>Errors: {service.metrics.errors}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Database & Cache Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>🗄️ Base de Datos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estado</span>
              <Badge className={getStatusColor(metrics.database.status === 'connected' ? 'healthy' : 'critical')}>
                {metrics.database.status === 'connected' ? 'Conectado' : 'Desconectado'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Conexiones</span>
              <span className="font-medium">
                {metrics.database.connections} / {metrics.database.maxConnections}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tiempo de Query</span>
              <span className="font-medium">{metrics.database.queryTime}ms</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tamaño BD</span>
              <span className="font-medium">{formatBytes(metrics.database.size)}</span>
            </div>
            
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Último Backup</span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(metrics.database.backup.status === 'success' ? 'healthy' : 'critical')}
                  <span className="text-sm">
                    {new Date(metrics.database.backup.lastBackup).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>⚡ Cache (Redis)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estado</span>
              <Badge className={getStatusColor(metrics.cache.status === 'connected' ? 'healthy' : 'critical')}>
                {metrics.cache.status === 'connected' ? 'Conectado' : 'Desconectado'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Hit Rate</span>
              <span className="font-medium text-green-600">{metrics.cache.hitRate}%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Uso de Memoria</span>
              <span className="font-medium">{metrics.cache.memoryUsage}%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Keys Almacenadas</span>
              <span className="font-medium">{metrics.cache.keyCount.toLocaleString()}</span>
            </div>
            
            <div className="pt-2 border-t">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Cache funcionando óptimamente</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {alerts.filter(alert => !alert.acknowledged).length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span>🚨 Alertas Activas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.filter(alert => !alert.acknowledged).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(alert.severity === 'critical' ? 'critical' : 'warning')}
                        <span className="font-medium text-gray-900">{alert.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {alert.service}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        <span>{new Date(alert.timestamp).toLocaleString('es-ES')}</span>
                        {alert.details.duration && (
                          <span>Duración: {alert.details.duration}</span>
                        )}
                        {alert.details.currentValue && alert.details.threshold && (
                          <span>
                            {alert.details.currentValue} / {alert.details.threshold} {alert.details.metric}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Resolver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Details Modal */}
      {showServiceDetails && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(selectedService.status)}
                  <span>{selectedService.name}</span>
                  <Badge className={getStatusColor(selectedService.status)}>
                    {selectedService.status}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowServiceDetails(false)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Service Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Información del Servicio</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Versión</p>
                    <p className="font-medium">{selectedService.version}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Endpoint</p>
                    <p className="font-medium font-mono text-xs">{selectedService.endpoint}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Uptime</p>
                    <p className="font-medium">{selectedService.uptime}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Última verificación</p>
                    <p className="font-medium">
                      {new Date(selectedService.lastCheck).toLocaleTimeString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Métricas de Rendimiento</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Requests Totales</p>
                    <p className="text-xl font-bold text-gray-900">
                      {selectedService.metrics.requests.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Tiempo de Respuesta</p>
                    <p className="text-xl font-bold text-gray-900">
                      {selectedService.metrics.avgResponseTime}ms
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Errores</p>
                    <p className="text-xl font-bold text-red-600">
                      {selectedService.metrics.errors}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Tasa de Error</p>
                    <p className="text-xl font-bold text-gray-900">
                      {((selectedService.metrics.errors / selectedService.metrics.requests) * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Resource Usage */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Uso de Recursos</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU Usage</span>
                      <span>{selectedService.metrics.cpuUsage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getPerformanceColor(
                          selectedService.metrics.cpuUsage,
                          { warning: 70, critical: 85 }
                        ).replace('text-', 'bg-')}`}
                        style={{ width: `${selectedService.metrics.cpuUsage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span>{selectedService.metrics.memoryUsage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getPerformanceColor(
                          selectedService.metrics.memoryUsage,
                          { warning: 75, critical: 90 }
                        ).replace('text-', 'bg-')}`}
                        style={{ width: `${selectedService.metrics.memoryUsage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dependencies */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Dependencias</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedService.dependencies.map((dep) => (
                    <Badge key={dep} variant="outline">
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SystemHealth;