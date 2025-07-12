/**
 * Tenant Management Component - Multi-Tenant Organization Management
 * Adaptive Learning Ecosystem - EbroValley Digital
 * 
 * Gestión completa de organizaciones multi-tenant con configuraciones avanzadas
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { SearchBar } from '../ui/search-bar';
import { LoadingSpinner } from '../ui/loading-spinner';
import { useAuth } from '../../hooks/useAuth';
import {
  Building2,
  Users,
  Settings,
  DollarSign,
  Globe,
  Calendar,
  Shield,
  Edit,
  Trash2,
  Plus,
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  Clock,
  Crown,
  Star,
  Zap
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  domain: string;
  type: 'university' | 'school' | 'corporate' | 'bootcamp';
  subscriptionPlan: 'starter' | 'professional' | 'enterprise';
  userCount: number;
  maxUsers: number;
  status: 'active' | 'suspended' | 'trial';
  features: string[];
  monthlyRevenue: number;
  createdAt: string;
  lastActivity: string;
  adminEmail: string;
  settings: {
    customBranding: boolean;
    apiAccess: boolean;
    advancedSecurity: boolean;
    customIntegrations: boolean;
  };
}

interface TenantFormData {
  name: string;
  domain: string;
  type: 'university' | 'school' | 'corporate' | 'bootcamp';
  subscriptionPlan: 'starter' | 'professional' | 'enterprise';
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
}

const TenantManagement: React.FC = () => {
  const { hasPermission } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');

  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    domain: '',
    type: 'corporate',
    subscriptionPlan: 'starter',
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    adminLastName: ''
  });

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tenants, searchTerm, filterStatus, filterPlan]);

  const loadTenants = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/tenants', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTenants(data);
      } else {
        // Mock data for demonstration
        const mockTenants: Tenant[] = [
          {
            id: '1',
            name: 'Universidad Tecnológica Digital',
            domain: 'utd.edu',
            type: 'university',
            subscriptionPlan: 'enterprise',
            userCount: 2840,
            maxUsers: 5000,
            status: 'active',
            features: ['ai_tutor', 'analytics', 'advanced_security', 'custom_branding'],
            monthlyRevenue: 8950,
            createdAt: '2024-01-15T10:00:00Z',
            lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            adminEmail: 'admin@utd.edu',
            settings: {
              customBranding: true,
              apiAccess: true,
              advancedSecurity: true,
              customIntegrations: true
            }
          },
          {
            id: '2',
            name: 'TechCorp Learning Solutions',
            domain: 'techcorp.com',
            type: 'corporate',
            subscriptionPlan: 'professional',
            userCount: 567,
            maxUsers: 1000,
            status: 'active',
            features: ['ai_tutor', 'analytics', 'progress_tracking'],
            monthlyRevenue: 2750,
            createdAt: '2024-02-20T14:30:00Z',
            lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            adminEmail: 'learning@techcorp.com',
            settings: {
              customBranding: false,
              apiAccess: true,
              advancedSecurity: false,
              customIntegrations: false
            }
          },
          {
            id: '3',
            name: 'DevBootcamp Pro',
            domain: 'devbootcamp.io',
            type: 'bootcamp',
            subscriptionPlan: 'starter',
            userCount: 128,
            maxUsers: 200,
            status: 'trial',
            features: ['basic_learning', 'progress_tracking'],
            monthlyRevenue: 490,
            createdAt: '2024-06-01T09:00:00Z',
            lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            adminEmail: 'admin@devbootcamp.io',
            settings: {
              customBranding: false,
              apiAccess: false,
              advancedSecurity: false,
              customIntegrations: false
            }
          }
        ];
        setTenants(mockTenants);
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = tenants;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tenant =>
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.adminEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(tenant => tenant.status === filterStatus);
    }

    // Plan filter
    if (filterPlan !== 'all') {
      filtered = filtered.filter(tenant => tenant.subscriptionPlan === filterPlan);
    }

    setFilteredTenants(filtered);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/auth/tenant/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          organization_name: formData.name,
          domain: formData.domain,
          organization_type: formData.type,
          subscription_plan: formData.subscriptionPlan,
          admin_email: formData.adminEmail,
          admin_password: formData.adminPassword,
          admin_first_name: formData.adminFirstName,
          admin_last_name: formData.adminLastName
        })
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          name: '',
          domain: '',
          type: 'corporate',
          subscriptionPlan: 'starter',
          adminEmail: '',
          adminPassword: '',
          adminFirstName: '',
          adminLastName: ''
        });
        loadTenants(); // Reload the list
      } else {
        const error = await response.json();
        console.error('Error creating tenant:', error);
      }
    } catch (error) {
      console.error('Error creating tenant:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'enterprise': return <Crown className="h-4 w-4 text-purple-600" />;
      case 'professional': return <Star className="h-4 w-4 text-blue-600" />;
      case 'starter': return <Zap className="h-4 w-4 text-green-600" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'university': return '🎓';
      case 'school': return '🏫';
      case 'corporate': return '🏢';
      case 'bootcamp': return '💻';
      default: return '🏢';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
            🏢 Gestión de Organizaciones
          </h2>
          <p className="text-sm text-gray-600">
            Administra todas las organizaciones y sus configuraciones
          </p>
        </div>
        
        {hasPermission('tenant:create') && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Organización</span>
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Buscar por nombre, dominio o email..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="trial">Prueba</option>
                <option value="suspended">Suspendido</option>
              </select>
              
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Todos los planes</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTenants.map((tenant) => (
          <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getTypeIcon(tenant.type)}</div>
                  <div>
                    <CardTitle className="text-lg">{tenant.name}</CardTitle>
                    <p className="text-sm text-gray-600">{tenant.domain}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Status and Plan */}
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(tenant.status)}>
                  {tenant.status === 'active' ? 'Activo' : 
                   tenant.status === 'trial' ? 'Prueba' : 'Suspendido'}
                </Badge>
                <div className="flex items-center space-x-1">
                  {getPlanIcon(tenant.subscriptionPlan)}
                  <span className="text-sm font-medium capitalize">
                    {tenant.subscriptionPlan}
                  </span>
                </div>
              </div>

              {/* Users */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Usuarios</span>
                </div>
                <span className="text-sm font-medium">
                  {tenant.userCount.toLocaleString()} / {tenant.maxUsers.toLocaleString()}
                </span>
              </div>

              {/* Revenue */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Ingresos/mes</span>
                </div>
                <span className="text-sm font-medium">
                  {formatCurrency(tenant.monthlyRevenue)}
                </span>
              </div>

              {/* Last Activity */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Última actividad</span>
                </div>
                <span className="text-sm text-gray-600">
                  {getTimeAgo(tenant.lastActivity)}
                </span>
              </div>

              {/* Features */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Características:</p>
                <div className="flex flex-wrap gap-1">
                  {tenant.features.slice(0, 3).map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature.replace('_', ' ')}
                    </Badge>
                  ))}
                  {tenant.features.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{tenant.features.length - 3} más
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedTenant(tenant)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Config
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTenants.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron organizaciones
            </h3>
            <p className="text-gray-600 mb-4">
              Ajusta los filtros o crea una nueva organización
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Organización
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Tenant Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>🏢 Nueva Organización</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTenant} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la organización
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dominio
                    </label>
                    <input
                      type="text"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="empresa.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de organización
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="corporate">Corporativo</option>
                      <option value="university">Universidad</option>
                      <option value="school">Escuela</option>
                      <option value="bootcamp">Bootcamp</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plan de suscripción
                    </label>
                    <select
                      value={formData.subscriptionPlan}
                      onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="starter">Starter</option>
                      <option value="professional">Professional</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    👤 Información del Administrador
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={formData.adminFirstName}
                        onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellidos
                      </label>
                      <input
                        type="text"
                        value={formData.adminLastName}
                        onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email del administrador
                      </label>
                      <input
                        type="email"
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña temporal
                      </label>
                      <input
                        type="password"
                        value={formData.adminPassword}
                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        minLength={8}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <Building2 className="h-4 w-4 mr-2" />
                    Crear Organización
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;