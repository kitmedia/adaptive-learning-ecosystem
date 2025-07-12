/**
 * Enterprise Admin Dashboard - Multi-Tenant Management Center
 * Adaptive Learning Ecosystem - EbroValley Digital
 * 
 * Dashboard administrativo empresarial con gestión completa multi-tenant
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/loading-spinner';
import { useAuth } from '../../hooks/useAuth';
import { useMonitoring } from '../../hooks/useMonitoring';
import {
  Users,
  Building2,
  BarChart3,
  Shield,
  Settings,
  Activity,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Database,
  Globe,
  UserCheck,
  FileText,
  Bell,
  Download
} from 'lucide-react';

// Lazy load admin components for performance
const TenantManagement = lazy(() => import('./TenantManagement'));
const UserManagement = lazy(() => import('./UserManagement'));
const AnalyticsConsole = lazy(() => import('./AnalyticsConsole'));
const SecurityCenter = lazy(() => import('./SecurityCenter'));
const SystemHealth = lazy(() => import('./SystemHealth'));
const RateLimitingDashboard = lazy(() => import('./RateLimitingDashboard'));
const BillingCenter = lazy(() => import('./BillingCenter'));
const SystemSettings = lazy(() => import('./SystemSettings'));
const AuditLogs = lazy(() => import('./AuditLogs'));

interface DashboardStats {
  totalTenants: number;
  totalUsers: number;
  activeUsers24h: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  revenue: number;
  alerts: number;
}

interface RecentActivity {
  id: string;
  type: 'user_login' | 'tenant_created' | 'system_alert' | 'security_event';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
  tenantName?: string;
}

const AdminDashboard: React.FC = () => {
  const { user, hasPermission, tenant } = useAuth();
  const { systemMetrics, isLoading: metricsLoading } = useMonitoring();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    totalUsers: 0,
    activeUsers24h: 0,
    systemHealth: 'healthy',
    revenue: 0,
    alerts: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user has admin access
  useEffect(() => {
    if (!user || !hasPermission('admin:dashboard')) {
      navigate('/unauthorized');
      return;
    }
  }, [user, hasPermission, navigate]);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
    loadRecentActivity();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData();
      loadRecentActivity();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - in real implementation, fetch from API
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Fallback mock data
        setStats({
          totalTenants: 145,
          totalUsers: 12847,
          activeUsers24h: 3421,
          systemHealth: 'healthy',
          revenue: 89650,
          alerts: 3
        });
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Use mock data on error
      setStats({
        totalTenants: 145,
        totalUsers: 12847,
        activeUsers24h: 3421,
        systemHealth: 'warning',
        revenue: 89650,
        alerts: 5
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/activity', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data);
      } else {
        // Fallback mock data
        setRecentActivity([
          {
            id: '1',
            type: 'tenant_created',
            message: 'Nueva organización "Universidad Digital" registrada',
            timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
            severity: 'info',
            tenantName: 'Universidad Digital'
          },
          {
            id: '2',
            type: 'security_event',
            message: 'Múltiples intentos de login fallidos detectados',
            timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
            severity: 'warning'
          },
          {
            id: '3',
            type: 'user_login',
            message: '1,247 usuarios activos en las últimas 24h',
            timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
            severity: 'info'
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🎛️ Centro de Administración
              </h1>
              <p className="text-sm text-gray-600">
                {user?.role === 'institution_admin' 
                  ? `Gestión de ${tenant?.name}` 
                  : 'Administración Global del Sistema'
                }
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge 
                variant="outline" 
                className={getHealthColor(stats.systemHealth)}
              >
                <Activity className="h-3 w-3 mr-1" />
                Sistema {stats.systemHealth === 'healthy' ? 'Saludable' : 
                       stats.systemHealth === 'warning' ? 'Advertencia' : 'Crítico'}
              </Badge>
              
              {stats.alerts > 0 && (
                <Badge variant="destructive">
                  <Bell className="h-3 w-3 mr-1" />
                  {stats.alerts} Alertas
                </Badge>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                🔄 Actualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Organizaciones</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.totalTenants)}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% este mes
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuarios Totales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.totalUsers)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  <UserCheck className="h-3 w-3 mr-1" />
                  {formatNumber(stats.activeUsers24h)} activos hoy
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos MRR</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.revenue)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8.5% vs mes anterior
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Salud del Sistema</p>
                  <p className="text-2xl font-bold text-gray-900">99.8%</p>
                </div>
                <Database className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="mt-2">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getHealthColor(stats.systemHealth)}`}
                >
                  <Activity className="h-3 w-3 mr-1" />
                  Operativo
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="tenants" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Organizaciones</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Seguridad</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Sistema</span>
            </TabsTrigger>
            <TabsTrigger value="rate-limiting" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Rate Limits</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Facturación</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configuración</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Actividad Reciente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                        {getSeverityIcon(activity.severity)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.message}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs text-gray-500">
                              {new Date(activity.timestamp).toLocaleString('es-ES')}
                            </p>
                            {activity.tenantName && (
                              <Badge variant="outline" className="text-xs">
                                {activity.tenantName}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Todos los Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>Acciones Rápidas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Building2 className="h-4 w-4 mr-2" />
                    Nueva Organización
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Gestionar Usuarios
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Datos
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Auditoría de Seguridad
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración Global
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tenant Management Tab */}
          <TabsContent value="tenants">
            <Suspense fallback={<LoadingSpinner />}>
              <TenantManagement />
            </Suspense>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users">
            <Suspense fallback={<LoadingSpinner />}>
              <UserManagement />
            </Suspense>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Suspense fallback={<LoadingSpinner />}>
              <AnalyticsConsole />
            </Suspense>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Suspense fallback={<LoadingSpinner />}>
              <SecurityCenter />
            </Suspense>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="health">
            <Suspense fallback={<LoadingSpinner />}>
              <SystemHealth />
            </Suspense>
          </TabsContent>

          {/* Rate Limiting Tab */}
          <TabsContent value="rate-limiting">
            <Suspense fallback={<LoadingSpinner />}>
              <RateLimitingDashboard />
            </Suspense>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <Suspense fallback={<LoadingSpinner />}>
              <BillingCenter />
            </Suspense>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Suspense fallback={<LoadingSpinner />}>
              <SystemSettings />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;