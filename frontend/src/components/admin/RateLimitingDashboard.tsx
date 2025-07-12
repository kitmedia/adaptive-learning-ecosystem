/**
 * Rate Limiting Dashboard - Real-time API Protection Monitoring
 * Adaptive Learning Ecosystem - EbroValley Digital
 * 
 * Dashboard completo para monitoreo de rate limiting y throttling inteligente
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LoadingSpinner } from '../ui/loading-spinner';
import { useAuth } from '../../hooks/useAuth';
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Users,
  Globe,
  Server,
  BarChart3,
  RefreshCw,
  Settings,
  Eye,
  Ban,
  Unlock,
  Timer,
  Gauge,
  Signal,
  Target,
  AlertCircle,
  Info,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  UserX,
  Filter,
  Download,
  Terminal,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface RateLimitMetrics {
  overall: {
    totalRequests: number;
    blockedRequests: number;
    allowedRequests: number;
    blockRate: number;
    topBlockedIPs: Array<{
      ip: string;
      requests: number;
      blocked: number;
    }>;
  };
  realtime: {
    requestsPerSecond: number;
    blockedPerSecond: number;
    activeClients: number;
    circuitBreakersOpen: number;
  };
  subscriptionPlans: {
    [plan: string]: {
      activeUsers: number;
      totalRequests: number;
      averageUsage: number;
      topConsumers: Array<{
        tenantId: string;
        tenantName: string;
        requests: number;
        usage: number;
      }>;
    };
  };
  endpoints: Array<{
    path: string;
    category: 'expensive' | 'standard' | 'auth' | 'admin';
    totalRequests: number;
    blockedRequests: number;
    averageResponseTime: number;
    errorRate: number;
    currentLimit: number;
    adaptiveMultiplier: number;
  }>;
  systemLoad: {
    cpuPercent: number;
    memoryPercent: number;
    networkLatency: number;
    loadLevel: 'low' | 'medium' | 'high' | 'critical';
    adaptiveStrategy: 'fixed' | 'adaptive' | 'circuit_breaker' | 'intelligent';
  };
  circuitBreakers: Array<{
    endpoint: string;
    state: 'closed' | 'open' | 'half_open';
    errorRate: number;
    openTime?: string;
    lastFailure?: string;
  }>;
  alerts: Array<{
    id: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    timestamp: string;
    acknowledged: boolean;
  }>;
}

interface RateLimitConfig {
  strategy: 'fixed' | 'adaptive' | 'circuit_breaker' | 'intelligent';
  globalEnabled: boolean;
  circuitBreakerEnabled: boolean;
  adaptiveThresholds: {
    lowLoad: number;
    mediumLoad: number;
    highLoad: number;
    criticalLoad: number;
  };
  defaultLimits: {
    starter: number;
    professional: number;
    enterprise: number;
  };
}

const RateLimitingDashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  
  const [metrics, setMetrics] = useState<RateLimitMetrics | null>(null);
  const [config, setConfig] = useState<RateLimitConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  useEffect(() => {
    loadRateLimitData();
    
    // Auto-refresh every 5 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadRateLimitData, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedTimeRange]);

  const loadRateLimitData = async () => {
    try {
      setIsLoading(true);
      
      const [metricsRes, configRes] = await Promise.allSettled([
        fetch(`/api/monitoring/rate-limits/metrics?timeRange=${selectedTimeRange}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }),
        fetch('/api/monitoring/rate-limits/config', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
      ]);

      // Mock data for demonstration
      const mockMetrics: RateLimitMetrics = {
        overall: {
          totalRequests: 1247563,
          blockedRequests: 15234,
          allowedRequests: 1232329,
          blockRate: 1.22,
          topBlockedIPs: [
            { ip: '192.168.1.100', requests: 5634, blocked: 1245 },
            { ip: '10.0.0.55', requests: 3421, blocked: 892 },
            { ip: '172.16.0.23', requests: 2876, blocked: 743 }
          ]
        },
        realtime: {
          requestsPerSecond: 847,
          blockedPerSecond: 12,
          activeClients: 2341,
          circuitBreakersOpen: 2
        },
        subscriptionPlans: {
          starter: {
            activeUsers: 145,
            totalRequests: 234567,
            averageUsage: 67.3,
            topConsumers: [
              { tenantId: 'ten_123', tenantName: 'DevBootcamp Pro', requests: 15634, usage: 89.2 },
              { tenantId: 'ten_456', tenantName: 'CodeAcademy Plus', requests: 12456, usage: 78.5 }
            ]
          },
          professional: {
            activeUsers: 67,
            totalRequests: 567890,
            averageUsage: 45.6,
            topConsumers: [
              { tenantId: 'ten_789', tenantName: 'TechCorp Learning', requests: 45634, usage: 67.8 },
              { tenantId: 'ten_101', tenantName: 'Innovation Labs', requests: 34521, usage: 56.3 }
            ]
          },
          enterprise: {
            activeUsers: 23,
            totalRequests: 445106,
            averageUsage: 32.4,
            topConsumers: [
              { tenantId: 'ten_202', tenantName: 'Universidad Digital', requests: 156789, usage: 45.2 },
              { tenantId: 'ten_303', tenantName: 'Global EdTech', requests: 123456, usage: 38.7 }
            ]
          }
        },
        endpoints: [
          {
            path: '/api/ai-tutor/generate',
            category: 'expensive',
            totalRequests: 45678,
            blockedRequests: 2345,
            averageResponseTime: 1456,
            errorRate: 0.034,
            currentLimit: 50,
            adaptiveMultiplier: 0.7
          },
          {
            path: '/api/analytics/report',
            category: 'expensive',
            totalRequests: 23456,
            blockedRequests: 1234,
            averageResponseTime: 892,
            errorRate: 0.021,
            currentLimit: 30,
            adaptiveMultiplier: 0.8
          },
          {
            path: '/api/auth/login',
            category: 'auth',
            totalRequests: 123456,
            blockedRequests: 5432,
            averageResponseTime: 234,
            errorRate: 0.156,
            currentLimit: 100,
            adaptiveMultiplier: 1.1
          },
          {
            path: '/api/courses',
            category: 'standard',
            totalRequests: 567890,
            blockedRequests: 3456,
            averageResponseTime: 145,
            errorRate: 0.008,
            currentLimit: 300,
            adaptiveMultiplier: 1.2
          },
          {
            path: '/api/admin/backup',
            category: 'admin',
            totalRequests: 1234,
            blockedRequests: 234,
            averageResponseTime: 5678,
            errorRate: 0.012,
            currentLimit: 5,
            adaptiveMultiplier: 0.5
          }
        ],
        systemLoad: {
          cpuPercent: 67.8,
          memoryPercent: 72.4,
          networkLatency: 23,
          loadLevel: 'high',
          adaptiveStrategy: 'intelligent'
        },
        circuitBreakers: [
          {
            endpoint: '/api/recommendations/generate',
            state: 'open',
            errorRate: 0.234,
            openTime: new Date(Date.now() - 15 * 60000).toISOString(),
            lastFailure: new Date(Date.now() - 5 * 60000).toISOString()
          },
          {
            endpoint: '/api/ai-tutor/analyze',
            state: 'half_open',
            errorRate: 0.156,
            openTime: new Date(Date.now() - 45 * 60000).toISOString(),
            lastFailure: new Date(Date.now() - 30 * 60000).toISOString()
          }
        ],
        alerts: [
          {
            id: '1',
            severity: 'critical',
            title: 'High Block Rate Detected',
            message: 'Rate limiting block rate has exceeded 2% for the last 10 minutes',
            timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
            acknowledged: false
          },
          {
            id: '2',
            severity: 'warning',
            title: 'Circuit Breaker Activated',
            message: 'Circuit breaker opened for /api/recommendations/generate due to high error rate',
            timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
            acknowledged: false
          }
        ]
      };

      const mockConfig: RateLimitConfig = {
        strategy: 'intelligent',
        globalEnabled: true,
        circuitBreakerEnabled: true,
        adaptiveThresholds: {
          lowLoad: 30,
          mediumLoad: 60,
          highLoad: 80,
          criticalLoad: 95
        },
        defaultLimits: {
          starter: 100,
          professional: 500,
          enterprise: 2000
        }
      };

      setMetrics(mockMetrics);
      setConfig(mockConfig);
      
    } catch (error) {
      console.error('Error loading rate limit data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed': return 'text-green-600 bg-green-100';
      case 'open': return 'text-red-600 bg-red-100';
      case 'half_open': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLoadLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'expensive': return <Zap className="h-4 w-4 text-red-600" />;
      case 'auth': return <Shield className="h-4 w-4 text-blue-600" />;
      case 'admin': return <Settings className="h-4 w-4 text-purple-600" />;
      default: return <Globe className="h-4 w-4 text-green-600" />;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${(num * 100).toFixed(1)}%`;
  };

  const resetCircuitBreaker = async (endpoint: string) => {
    try {
      await fetch('/api/monitoring/rate-limits/circuit-breaker/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ endpoint })
      });
      
      // Reload data to reflect changes
      loadRateLimitData();
    } catch (error) {
      console.error('Error resetting circuit breaker:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!metrics || !config) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No se pudieron cargar las métricas de rate limiting</p>
        <Button onClick={loadRateLimitData} className="mt-4">
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
            🛡️ Rate Limiting & API Protection
          </h2>
          <p className="text-sm text-gray-600">
            Monitoreo en tiempo real de throttling inteligente y protección de APIs
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="5m">Últimos 5 min</option>
            <option value="15m">Últimos 15 min</option>
            <option value="1h">Última hora</option>
            <option value="6h">Últimas 6 horas</option>
            <option value="24h">Últimas 24 horas</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-300' : ''}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
          
          <Button size="sm" onClick={loadRateLimitData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Real-time Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Requests/seg</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatNumber(metrics.realtime.requestsPerSecond)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatNumber(metrics.realtime.blockedPerSecond)} bloqueados/seg
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Bloqueo</p>
                <p className={`text-2xl font-bold ${
                  metrics.overall.blockRate > 2 ? 'text-red-600' : 
                  metrics.overall.blockRate > 1 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {metrics.overall.blockRate.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatNumber(metrics.overall.blockedRequests)} bloqueados
                </p>
              </div>
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(metrics.realtime.activeClients)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Conectados simultáneamente
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Circuit Breakers</p>
                <p className={`text-2xl font-bold ${
                  metrics.realtime.circuitBreakersOpen > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {metrics.realtime.circuitBreakersOpen}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Abiertos actualmente
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Load & Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gauge className="h-5 w-5" />
            <span>⚡ Carga del Sistema & Estrategia Adaptativa</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle 
                    cx="40" cy="40" r="30" 
                    stroke="currentColor" 
                    strokeWidth="6" 
                    fill="transparent" 
                    className="text-gray-200"
                  />
                  <circle 
                    cx="40" cy="40" r="30" 
                    stroke="currentColor" 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray={`${(metrics.systemLoad.cpuPercent / 100) * 188.5} 188.5`}
                    className={getLoadLevelColor(metrics.systemLoad.loadLevel)}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-900">
                    {metrics.systemLoad.cpuPercent.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Cpu className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">CPU</span>
              </div>
            </div>

            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle 
                    cx="40" cy="40" r="30" 
                    stroke="currentColor" 
                    strokeWidth="6" 
                    fill="transparent" 
                    className="text-gray-200"
                  />
                  <circle 
                    cx="40" cy="40" r="30" 
                    stroke="currentColor" 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray={`${(metrics.systemLoad.memoryPercent / 100) * 188.5} 188.5`}
                    className={getLoadLevelColor(metrics.systemLoad.loadLevel)}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-900">
                    {metrics.systemLoad.memoryPercent.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <MemoryStick className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">RAM</span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {metrics.systemLoad.networkLatency}
                  </div>
                  <div className="text-xs text-blue-600">ms</div>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Wifi className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Latencia</span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-sm font-bold text-purple-600 capitalize">
                    {metrics.systemLoad.adaptiveStrategy}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Target className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Estrategia</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(metrics.systemLoad.loadLevel)}>
                  Carga: {metrics.systemLoad.loadLevel.toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  Estrategia: {metrics.systemLoad.adaptiveStrategy}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                Límites ajustados automáticamente según carga del sistema
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>📊 Análisis por Endpoint</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.endpoints.map((endpoint, index) => (
              <div
                key={endpoint.path}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(endpoint.category)}
                    <div>
                      <h4 className="font-medium text-gray-900">{endpoint.path}</h4>
                      <p className="text-sm text-gray-600 capitalize">
                        Categoría: {endpoint.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline">
                      Límite: {endpoint.currentLimit}/min
                    </Badge>
                    <Badge className={
                      endpoint.adaptiveMultiplier > 1 ? 'bg-green-100 text-green-800' :
                      endpoint.adaptiveMultiplier < 1 ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      Multiplicador: {endpoint.adaptiveMultiplier.toFixed(1)}x
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total Requests</p>
                    <p className="font-medium">{formatNumber(endpoint.totalRequests)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Bloqueados</p>
                    <p className="font-medium text-red-600">
                      {formatNumber(endpoint.blockedRequests)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tasa de Bloqueo</p>
                    <p className="font-medium">
                      {((endpoint.blockedRequests / endpoint.totalRequests) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tiempo Respuesta</p>
                    <p className="font-medium">{endpoint.averageResponseTime}ms</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tasa de Error</p>
                    <p className="font-medium">{formatPercentage(endpoint.errorRate)}</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (endpoint.blockedRequests / endpoint.totalRequests) * 100 * 10)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Circuit Breakers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <XCircle className="h-5 w-5" />
            <span>⚡ Circuit Breakers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.circuitBreakers.length > 0 ? (
            <div className="space-y-4">
              {metrics.circuitBreakers.map((cb, index) => (
                <div
                  key={cb.endpoint}
                  className={`p-4 border rounded-lg ${
                    cb.state === 'open' ? 'border-red-200 bg-red-50' :
                    cb.state === 'half_open' ? 'border-yellow-200 bg-yellow-50' :
                    'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge className={getStatusColor(cb.state)}>
                          {cb.state.replace('_', '-').toUpperCase()}
                        </Badge>
                        <span className="font-medium text-gray-900">{cb.endpoint}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Tasa de Error</p>
                          <p className="font-medium text-red-600">
                            {formatPercentage(cb.errorRate)}
                          </p>
                        </div>
                        {cb.openTime && (
                          <div>
                            <p className="text-gray-500">Abierto desde</p>
                            <p className="font-medium">
                              {new Date(cb.openTime).toLocaleTimeString('es-ES')}
                            </p>
                          </div>
                        )}
                        {cb.lastFailure && (
                          <div>
                            <p className="text-gray-500">Último fallo</p>
                            <p className="font-medium">
                              {new Date(cb.lastFailure).toLocaleTimeString('es-ES')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetCircuitBreaker(cb.endpoint)}
                        disabled={cb.state === 'closed'}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-gray-600">Todos los circuit breakers están cerrados</p>
              <p className="text-sm text-gray-500">El sistema está funcionando normalmente</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Plans Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(metrics.subscriptionPlans).map(([plan, data]) => (
          <Card key={plan}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 capitalize">
                <Crown className={`h-5 w-5 ${
                  plan === 'enterprise' ? 'text-purple-600' :
                  plan === 'professional' ? 'text-blue-600' : 'text-green-600'
                }`} />
                <span>Plan {plan}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Usuarios Activos</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatNumber(data.activeUsers)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Total Requests</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatNumber(data.totalRequests)}
                  </p>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Uso Promedio</span>
                  <span>{data.averageUsage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      plan === 'enterprise' ? 'bg-purple-600' :
                      plan === 'professional' ? 'bg-blue-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${data.averageUsage}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Top Consumidores:</p>
                <div className="space-y-2">
                  {data.topConsumers.slice(0, 3).map((consumer, index) => (
                    <div key={consumer.tenantId} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 truncate">{consumer.tenantName}</span>
                      <span className="font-medium">{consumer.usage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Alerts */}
      {metrics.alerts.filter(alert => !alert.acknowledged).length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span>🚨 Alertas de Rate Limiting</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.alerts.filter(alert => !alert.acknowledged).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border rounded-lg ${
                    alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
                    alert.severity === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {alert.severity === 'critical' ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : alert.severity === 'warning' ? (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Info className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="font-medium text-gray-900">{alert.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleString('es-ES')}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Confirmar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RateLimitingDashboard;