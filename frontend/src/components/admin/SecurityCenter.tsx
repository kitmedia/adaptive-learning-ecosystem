/**
 * Security Center - Enterprise Security Monitoring and Audit Center
 * Adaptive Learning Ecosystem - EbroValley Digital
 * 
 * Centro de seguridad empresarial con monitoreo, auditoría y gestión de amenazas
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { SearchBar } from '../ui/search-bar';
import { LoadingSpinner } from '../ui/loading-spinner';
import { useAuth } from '../../hooks/useAuth';
import {
  Shield,
  AlertTriangle,
  Lock,
  Eye,
  Activity,
  Users,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Filter,
  RefreshCw,
  Search,
  Key,
  Server,
  Wifi,
  Database,
  FileText,
  Settings,
  Ban,
  UserX,
  Zap,
  TrendingUp,
  Info,
  Calendar,
  MapPin
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: 'login_attempt' | 'failed_login' | 'suspicious_activity' | 'data_access' | 'permission_change' | 'system_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userName?: string;
  tenantId: string;
  tenantName: string;
  ipAddress: string;
  userAgent: string;
  description: string;
  details: {
    location?: string;
    device?: string;
    action?: string;
    resource?: string;
    outcome?: 'success' | 'failure' | 'blocked';
  };
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
}

interface SecurityMetrics {
  totalEvents: number;
  criticalAlerts: number;
  activeThreats: number;
  blockedAttempts: number;
  securityScore: number;
  trends: {
    eventsChange: number;
    threatsChange: number;
    scoreChange: number;
  };
  topRisks: Array<{
    type: string;
    count: number;
    severity: string;
  }>;
  recentActivity: {
    loginAttempts: number;
    failedLogins: number;
    suspiciousActivity: number;
    dataAccess: number;
  };
}

interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'authentication' | 'authorization' | 'data_protection' | 'network' | 'compliance';
  lastUpdated: string;
  triggeredCount: number;
}

const SecurityCenter: React.FC = () => {
  const { user, hasPermission, tenant } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<SecurityEvent[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadSecurityData();
    
    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadSecurityData, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeRange]);

  useEffect(() => {
    applyFilters();
  }, [securityEvents, searchTerm, filterSeverity, filterType, filterStatus]);

  const loadSecurityData = async () => {
    try {
      setIsLoading(true);
      
      // Load security events
      const eventsResponse = await fetch(`/api/admin/security/events?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      // Load security metrics
      const metricsResponse = await fetch(`/api/admin/security/metrics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      // Load security policies
      const policiesResponse = await fetch('/api/admin/security/policies', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (eventsResponse.ok && metricsResponse.ok && policiesResponse.ok) {
        const events = await eventsResponse.json();
        const metrics = await metricsResponse.json();
        const policies = await policiesResponse.json();
        
        setSecurityEvents(events);
        setSecurityMetrics(metrics);
        setSecurityPolicies(policies);
      } else {
        // Mock data for demonstration
        loadMockData();
      }
    } catch (error) {
      console.error('Error loading security data:', error);
      loadMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockData = () => {
    const mockEvents: SecurityEvent[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        eventType: 'failed_login',
        severity: 'high',
        userId: undefined,
        userName: undefined,
        tenantId: '1',
        tenantName: 'Universidad Tecnológica Digital',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        description: 'Múltiples intentos de login fallidos desde IP sospechosa',
        details: {
          location: 'Madrid, España',
          device: 'Windows Desktop',
          action: 'login_attempt',
          outcome: 'failure'
        },
        status: 'investigating'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        eventType: 'suspicious_activity',
        severity: 'critical',
        userId: '123',
        userName: 'usuario.sospechoso@example.com',
        tenantId: '2',
        tenantName: 'TechCorp Learning Solutions',
        ipAddress: '203.0.113.45',
        userAgent: 'curl/7.68.0',
        description: 'Acceso a API desde herramienta automatizada fuera de horario',
        details: {
          location: 'Desconocida',
          device: 'CLI Tool',
          action: 'api_access',
          resource: '/api/admin/users',
          outcome: 'blocked'
        },
        status: 'new'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        eventType: 'permission_change',
        severity: 'medium',
        userId: '456',
        userName: 'admin@utd.edu',
        tenantId: '1',
        tenantName: 'Universidad Tecnológica Digital',
        ipAddress: '192.168.1.45',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        description: 'Cambio de permisos de usuario a rol de administrador',
        details: {
          location: 'Madrid, España',
          device: 'MacBook Pro',
          action: 'role_change',
          resource: 'user_permissions',
          outcome: 'success'
        },
        status: 'resolved'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        eventType: 'data_access',
        severity: 'low',
        userId: '789',
        userName: 'instructor@techcorp.com',
        tenantId: '2',
        tenantName: 'TechCorp Learning Solutions',
        ipAddress: '10.0.0.23',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        description: 'Descarga masiva de datos de estudiantes',
        details: {
          location: 'Barcelona, España',
          device: 'iPhone',
          action: 'data_export',
          resource: 'student_data',
          outcome: 'success'
        },
        status: 'resolved'
      }
    ];

    const mockMetrics: SecurityMetrics = {
      totalEvents: 1247,
      criticalAlerts: 3,
      activeThreats: 1,
      blockedAttempts: 89,
      securityScore: 87.5,
      trends: {
        eventsChange: 12.5,
        threatsChange: -25.0,
        scoreChange: 3.2
      },
      topRisks: [
        { type: 'Failed Login Attempts', count: 45, severity: 'high' },
        { type: 'Suspicious API Access', count: 12, severity: 'critical' },
        { type: 'Unusual Data Access', count: 8, severity: 'medium' },
        { type: 'Permission Escalation', count: 3, severity: 'high' }
      ],
      recentActivity: {
        loginAttempts: 1584,
        failedLogins: 89,
        suspiciousActivity: 12,
        dataAccess: 234
      }
    };

    const mockPolicies: SecurityPolicy[] = [
      {
        id: '1',
        name: 'Multi-Factor Authentication',
        description: 'Require MFA for all administrative accounts',
        enabled: true,
        severity: 'high',
        type: 'authentication',
        lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        triggeredCount: 45
      },
      {
        id: '2',
        name: 'Suspicious Login Detection',
        description: 'Detect and block suspicious login attempts',
        enabled: true,
        severity: 'critical',
        type: 'authentication',
        lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        triggeredCount: 12
      },
      {
        id: '3',
        name: 'Data Access Monitoring',
        description: 'Monitor and log all sensitive data access',
        enabled: true,
        severity: 'medium',
        type: 'data_protection',
        lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        triggeredCount: 234
      },
      {
        id: '4',
        name: 'API Rate Limiting',
        description: 'Prevent API abuse through rate limiting',
        enabled: false,
        severity: 'medium',
        type: 'network',
        lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        triggeredCount: 0
      }
    ];

    setSecurityEvents(mockEvents);
    setSecurityMetrics(mockMetrics);
    setSecurityPolicies(mockPolicies);
  };

  const applyFilters = () => {
    let filtered = securityEvents;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.ipAddress.includes(searchTerm) ||
        event.tenantName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Severity filter
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(event => event.severity === filterSeverity);
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(event => event.eventType === filterType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(event => event.status === filterStatus);
    }

    // If current user is institution_admin, only show events from their tenant
    if (user?.role === 'institution_admin') {
      filtered = filtered.filter(event => event.tenantId === user.tenant_id);
    }

    setFilteredEvents(filtered);
  };

  const handleEventStatusChange = async (eventId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/security/events/${eventId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setSecurityEvents(events =>
          events.map(event =>
            event.id === eventId ? { ...event, status: newStatus as any } : event
          )
        );
      }
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  };

  const handlePolicyToggle = async (policyId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/security/policies/${policyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        setSecurityPolicies(policies =>
          policies.map(policy =>
            policy.id === policyId ? { ...policy, enabled } : policy
          )
        );
      }
    } catch (error) {
      console.error('Error updating policy:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertCircle className="h-4 w-4" />;
      case 'medium': return <Info className="h-4 w-4" />;
      case 'low': return <Eye className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'false_positive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'login_attempt': return <Key className="h-4 w-4" />;
      case 'failed_login': return <XCircle className="h-4 w-4" />;
      case 'suspicious_activity': return <AlertTriangle className="h-4 w-4" />;
      case 'data_access': return <Database className="h-4 w-4" />;
      case 'permission_change': return <Users className="h-4 w-4" />;
      case 'system_access': return <Server className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'hace un momento';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            🛡️ Centro de Seguridad
          </h2>
          <p className="text-sm text-gray-600">
            Monitoreo de seguridad, auditoría y gestión de amenazas en tiempo real
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="1h">Última hora</option>
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
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
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Button size="sm" onClick={loadSecurityData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Security Score and Key Metrics */}
      {securityMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Security Score */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
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
                      strokeDasharray={`${(securityMetrics.securityScore / 100) * 251.3} 251.3`}
                      className={securityMetrics.securityScore >= 80 ? 'text-green-500' : 
                                securityMetrics.securityScore >= 60 ? 'text-yellow-500' : 'text-red-500'}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">
                      {securityMetrics.securityScore.toFixed(0)}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900">Security Score</p>
                <div className="flex items-center justify-center space-x-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">
                    +{securityMetrics.trends.scoreChange.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Alertas Críticas</p>
                  <p className="text-3xl font-bold text-red-600">
                    {securityMetrics.criticalAlerts}
                  </p>
                </div>
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Amenazas Activas</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {securityMetrics.activeThreats}
                  </p>
                </div>
                <Shield className="h-12 w-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Intentos Bloqueados</p>
                  <p className="text-3xl font-bold text-green-600">
                    {securityMetrics.blockedAttempts}
                  </p>
                </div>
                <Ban className="h-12 w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Eventos Totales</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {securityMetrics.totalEvents.toLocaleString()}
                  </p>
                </div>
                <Activity className="h-12 w-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Risks and Recent Activity */}
      {securityMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Security Risks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span>⚠️ Principales Riesgos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityMetrics.topRisks.map((risk, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        risk.severity === 'critical' ? 'bg-red-500' :
                        risk.severity === 'high' ? 'bg-orange-500' :
                        risk.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{risk.type}</p>
                        <p className="text-sm text-gray-600">{risk.count} incidentes</p>
                      </div>
                    </div>
                    <Badge className={getSeverityColor(risk.severity)}>
                      {risk.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span>📊 Actividad Reciente</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Key className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">
                    {securityMetrics.recentActivity.loginAttempts}
                  </p>
                  <p className="text-sm text-gray-600">Intentos de Login</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">
                    {securityMetrics.recentActivity.failedLogins}
                  </p>
                  <p className="text-sm text-gray-600">Logins Fallidos</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">
                    {securityMetrics.recentActivity.suspiciousActivity}
                  </p>
                  <p className="text-sm text-gray-600">Actividad Sospechosa</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Database className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">
                    {securityMetrics.recentActivity.dataAccess}
                  </p>
                  <p className="text-sm text-gray-600">Accesos a Datos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Events */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <span>🔍 Eventos de Seguridad ({filteredEvents.length})</span>
            </CardTitle>
            
            <div className="flex items-center space-x-3">
              <SearchBar
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-64"
              />
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mt-4">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Todas las severidades</option>
              <option value="critical">Crítico</option>
              <option value="high">Alto</option>
              <option value="medium">Medio</option>
              <option value="low">Bajo</option>
            </select>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Todos los tipos</option>
              <option value="login_attempt">Intento de Login</option>
              <option value="failed_login">Login Fallido</option>
              <option value="suspicious_activity">Actividad Sospechosa</option>
              <option value="data_access">Acceso a Datos</option>
              <option value="permission_change">Cambio de Permisos</option>
              <option value="system_access">Acceso al Sistema</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="new">Nuevo</option>
              <option value="investigating">Investigando</option>
              <option value="resolved">Resuelto</option>
              <option value="false_positive">Falso Positivo</option>
            </select>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div 
                key={event.id} 
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex items-center space-x-2">
                      {getEventTypeIcon(event.eventType)}
                      {getSeverityIcon(event.severity)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status === 'new' ? 'Nuevo' :
                           event.status === 'investigating' ? 'Investigando' :
                           event.status === 'resolved' ? 'Resuelto' : 'Falso Positivo'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {getTimeAgo(event.timestamp)}
                        </span>
                      </div>
                      
                      <h4 className="font-medium text-gray-900 mb-1">
                        {event.description}
                      </h4>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Globe className="h-3 w-3" />
                          <span>{event.ipAddress}</span>
                        </span>
                        {event.userName && (
                          <span className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{event.userName}</span>
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{event.details.location || 'Desconocida'}</span>
                        </span>
                        <span>{event.tenantName}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {event.status === 'new' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventStatusChange(event.id, 'investigating');
                        }}
                      >
                        Investigar
                      </Button>
                    )}
                    {event.status === 'investigating' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventStatusChange(event.id, 'resolved');
                        }}
                      >
                        Resolver
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron eventos
              </h3>
              <p className="text-gray-600">
                Ajusta los filtros para ver eventos de seguridad
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <span>⚙️ Políticas de Seguridad</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {securityPolicies.map((policy) => (
              <div key={policy.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{policy.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{policy.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policy.enabled}
                      onChange={(e) => handlePolicyToggle(policy.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge className={getSeverityColor(policy.severity)}>
                      {policy.severity}
                    </Badge>
                    <Badge variant="outline">
                      {policy.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <span className="text-gray-600">
                    {policy.triggeredCount} activaciones
                  </span>
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  Actualizado: {formatDate(policy.lastUpdated)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {getEventTypeIcon(selectedEvent.eventType)}
                <span>🔍 Detalles del Evento</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Severidad</p>
                  <Badge className={getSeverityColor(selectedEvent.severity)}>
                    {selectedEvent.severity}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Estado</p>
                  <Badge className={getStatusColor(selectedEvent.status)}>
                    {selectedEvent.status}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Descripción</p>
                <p className="text-gray-900">{selectedEvent.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Timestamp</p>
                  <p className="text-sm text-gray-900">{formatDate(selectedEvent.timestamp)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">IP Address</p>
                  <p className="text-sm font-mono text-gray-900">{selectedEvent.ipAddress}</p>
                </div>
              </div>

              {selectedEvent.userName && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Usuario</p>
                  <p className="text-sm text-gray-900">{selectedEvent.userName}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700">Organización</p>
                <p className="text-sm text-gray-900">{selectedEvent.tenantName}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Detalles Técnicos</p>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  {selectedEvent.details.location && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ubicación:</span>
                      <span className="text-sm font-medium">{selectedEvent.details.location}</span>
                    </div>
                  )}
                  {selectedEvent.details.device && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Dispositivo:</span>
                      <span className="text-sm font-medium">{selectedEvent.details.device}</span>
                    </div>
                  )}
                  {selectedEvent.details.action && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Acción:</span>
                      <span className="text-sm font-medium">{selectedEvent.details.action}</span>
                    </div>
                  )}
                  {selectedEvent.details.outcome && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Resultado:</span>
                      <Badge variant="outline" className={
                        selectedEvent.details.outcome === 'success' ? 'text-green-700' :
                        selectedEvent.details.outcome === 'failure' ? 'text-red-700' : 'text-yellow-700'
                      }>
                        {selectedEvent.details.outcome}
                      </Badge>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">User Agent:</span>
                    <span className="text-xs font-mono truncate max-w-xs">{selectedEvent.userAgent}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedEvent(null)}
                >
                  Cerrar
                </Button>
                {selectedEvent.status === 'new' && (
                  <Button
                    onClick={() => {
                      handleEventStatusChange(selectedEvent.id, 'investigating');
                      setSelectedEvent(null);
                    }}
                  >
                    Marcar como Investigando
                  </Button>
                )}
                {selectedEvent.status === 'investigating' && (
                  <Button
                    onClick={() => {
                      handleEventStatusChange(selectedEvent.id, 'resolved');
                      setSelectedEvent(null);
                    }}
                  >
                    Marcar como Resuelto
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SecurityCenter;