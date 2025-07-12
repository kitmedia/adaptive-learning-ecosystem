/**
 * User Management Component - Advanced RBAC User Administration
 * Adaptive Learning Ecosystem - EbroValley Digital
 * 
 * Gestión avanzada de usuarios con RBAC, permisos granulares y multi-tenant
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { SearchBar } from '../ui/search-bar';
import { LoadingSpinner } from '../ui/loading-spinner';
import { useAuth } from '../../hooks/useAuth';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Key,
  Mail,
  Calendar,
  MoreVertical,
  Filter,
  Download,
  Upload,
  Crown,
  Star,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Lock,
  Unlock
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin' | 'institution_admin';
  tenantId: string;
  tenantName: string;
  status: 'active' | 'suspended' | 'pending_verification';
  lastLogin: string | null;
  createdAt: string;
  permissions: string[];
  learningStats?: {
    coursesEnrolled: number;
    coursesCompleted: number;
    totalStudyHours: number;
  };
  instructorStats?: {
    coursesCreated: number;
    studentsCount: number;
    averageRating: number;
  };
  metadata: {
    loginCount: number;
    lastActivity: string;
    ipAddress: string;
    userAgent: string;
  };
}

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin' | 'institution_admin';
  tenantId: string;
  password: string;
  permissions: string[];
  sendWelcomeEmail: boolean;
}

const UserManagement: React.FC = () => {
  const { user: currentUser, hasPermission, tenant } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTenant, setFilterTenant] = useState<string>('all');

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'student',
    tenantId: tenant?.tenant_id || '',
    password: '',
    permissions: [],
    sendWelcomeEmail: true
  });

  const [availablePermissions] = useState([
    'course:read', 'course:create', 'course:edit', 'course:delete',
    'user:read', 'user:create', 'user:edit', 'user:delete',
    'analytics:read', 'analytics:write', 'analytics:export',
    'content:read', 'content:create', 'content:edit', 'content:delete',
    'assessment:read', 'assessment:create', 'assessment:grade',
    'system:configure', 'tenant:manage', 'billing:manage'
  ]);

  const [tenants, setTenants] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    loadUsers();
    if (currentUser?.role === 'admin') {
      loadTenants();
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, filterRole, filterStatus, filterTenant]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        // Mock data for demonstration
        const mockUsers: User[] = [
          {
            id: '1',
            email: 'maria.rodriguez@utd.edu',
            firstName: 'María',
            lastName: 'Rodríguez',
            role: 'instructor',
            tenantId: '1',
            tenantName: 'Universidad Tecnológica Digital',
            status: 'active',
            lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            createdAt: '2024-01-20T10:00:00Z',
            permissions: ['course:read', 'course:create', 'course:edit', 'student:view', 'analytics:read'],
            instructorStats: {
              coursesCreated: 12,
              studentsCount: 342,
              averageRating: 4.8
            },
            metadata: {
              loginCount: 156,
              lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              ipAddress: '192.168.1.45',
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          },
          {
            id: '2',
            email: 'carlos.manager@techcorp.com',
            firstName: 'Carlos',
            lastName: 'Manager',
            role: 'institution_admin',
            tenantId: '2',
            tenantName: 'TechCorp Learning Solutions',
            status: 'active',
            lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            createdAt: '2024-02-20T14:30:00Z',
            permissions: ['tenant:manage', 'user:manage', 'course:manage', 'analytics:full', 'billing:manage'],
            metadata: {
              loginCount: 89,
              lastActivity: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
              ipAddress: '10.0.0.23',
              userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
          },
          {
            id: '3',
            email: 'ana.student@utd.edu',
            firstName: 'Ana',
            lastName: 'García',
            role: 'student',
            tenantId: '1',
            tenantName: 'Universidad Tecnológica Digital',
            status: 'active',
            lastLogin: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            createdAt: '2024-03-15T09:00:00Z',
            permissions: ['course:read', 'course:enroll', 'progress:read', 'assessment:take'],
            learningStats: {
              coursesEnrolled: 6,
              coursesCompleted: 3,
              totalStudyHours: 147
            },
            metadata: {
              loginCount: 234,
              lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              ipAddress: '192.168.1.78',
              userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
            }
          },
          {
            id: '4',
            email: 'pending.user@devbootcamp.io',
            firstName: 'Usuario',
            lastName: 'Pendiente',
            role: 'student',
            tenantId: '3',
            tenantName: 'DevBootcamp Pro',
            status: 'pending_verification',
            lastLogin: null,
            createdAt: '2024-06-10T16:00:00Z',
            permissions: ['course:read'],
            metadata: {
              loginCount: 0,
              lastActivity: new Date().toISOString(),
              ipAddress: '203.0.113.45',
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }
        ];
        setUsers(mockUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const response = await fetch('/api/admin/tenants/simple', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTenants(data);
      } else {
        // Mock data
        setTenants([
          { id: '1', name: 'Universidad Tecnológica Digital' },
          { id: '2', name: 'TechCorp Learning Solutions' },
          { id: '3', name: 'DevBootcamp Pro' }
        ]);
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  const applyFilters = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.tenantName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    // Tenant filter
    if (filterTenant !== 'all') {
      filtered = filtered.filter(user => user.tenantId === filterTenant);
    }

    // If current user is institution_admin, only show users from their tenant
    if (currentUser?.role === 'institution_admin') {
      filtered = filtered.filter(user => user.tenantId === currentUser.tenant_id);
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role,
          tenant_domain: tenants.find(t => t.id === formData.tenantId)?.name
        })
      });

      if (response.ok) {
        setShowCreateForm(false);
        resetForm();
        loadUsers();
      } else {
        const error = await response.json();
        console.error('Error creating user:', error);
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status: newStatus as any } : user
        ));
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'student',
      tenantId: tenant?.tenant_id || '',
      password: '',
      permissions: [],
      sendWelcomeEmail: true
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-purple-600" />;
      case 'institution_admin': return <Star className="h-4 w-4 text-blue-600" />;
      case 'instructor': return <Shield className="h-4 w-4 text-green-600" />;
      case 'student': return <Zap className="h-4 w-4 text-gray-600" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'institution_admin': return 'bg-blue-100 text-blue-800';
      case 'instructor': return 'bg-green-100 text-green-800';
      case 'student': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending_verification': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'suspended': return <XCircle className="h-4 w-4" />;
      case 'pending_verification': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    
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
            👥 Gestión de Usuarios
          </h2>
          <p className="text-sm text-gray-600">
            Administra usuarios con control de acceso granular y RBAC
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          {hasPermission('user:create') && (
            <Button onClick={() => setShowCreateForm(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Buscar por nombre, email o organización..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-4">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Todos los roles</option>
                <option value="student">Estudiante</option>
                <option value="instructor">Instructor</option>
                <option value="institution_admin">Admin Institución</option>
                {currentUser?.role === 'admin' && (
                  <option value="admin">Administrador</option>
                )}
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="suspended">Suspendido</option>
                <option value="pending_verification">Pendiente</option>
              </select>
              
              {currentUser?.role === 'admin' && (
                <select
                  value={filterTenant}
                  onChange={(e) => setFilterTenant(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Todas las organizaciones</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📊 Lista de Usuarios ({filteredUsers.length})</span>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros Avanzados
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Usuario</th>
                  <th className="text-left py-3 px-4">Rol</th>
                  <th className="text-left py-3 px-4">Estado</th>
                  <th className="text-left py-3 px-4">Organización</th>
                  <th className="text-left py-3 px-4">Último acceso</th>
                  <th className="text-left py-3 px-4">Estadísticas</th>
                  <th className="text-right py-3 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <Badge className={`${getRoleColor(user.role)} flex items-center space-x-1 w-fit`}>
                        {getRoleIcon(user.role)}
                        <span className="capitalize">
                          {user.role === 'institution_admin' ? 'Admin' : user.role}
                        </span>
                      </Badge>
                    </td>
                    
                    <td className="py-4 px-4">
                      <Badge className={`${getStatusColor(user.status)} flex items-center space-x-1 w-fit`}>
                        {getStatusIcon(user.status)}
                        <span>
                          {user.status === 'active' ? 'Activo' : 
                           user.status === 'suspended' ? 'Suspendido' : 'Pendiente'}
                        </span>
                      </Badge>
                    </td>
                    
                    <td className="py-4 px-4">
                      <p className="text-sm font-medium text-gray-900">
                        {user.tenantName}
                      </p>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm text-gray-900">
                          {getTimeAgo(user.lastLogin)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.metadata.loginCount} inicios
                        </p>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      {user.learningStats && (
                        <div className="text-xs">
                          <p>{user.learningStats.coursesCompleted}/{user.learningStats.coursesEnrolled} cursos</p>
                          <p>{user.learningStats.totalStudyHours}h estudio</p>
                        </div>
                      )}
                      {user.instructorStats && (
                        <div className="text-xs">
                          <p>{user.instructorStats.coursesCreated} cursos</p>
                          <p>{user.instructorStats.studentsCount} estudiantes</p>
                          <p>⭐ {user.instructorStats.averageRating}</p>
                        </div>
                      )}
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {hasPermission('user:edit') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowCreateForm(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {hasPermission('user:manage') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleUserStatus(user.id, user.status)}
                          >
                            {user.status === 'active' ? 
                              <Lock className="h-4 w-4 text-red-600" /> : 
                              <Unlock className="h-4 w-4 text-green-600" />
                            }
                          </Button>
                        )}
                        
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron usuarios
              </h3>
              <p className="text-gray-600 mb-4">
                Ajusta los filtros o crea un nuevo usuario
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {selectedUser ? '✏️ Editar Usuario' : '👤 Nuevo Usuario'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rol
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="student">Estudiante</option>
                      <option value="instructor">Instructor</option>
                      <option value="institution_admin">Admin Institución</option>
                      {currentUser?.role === 'admin' && (
                        <option value="admin">Administrador</option>
                      )}
                    </select>
                  </div>
                  
                  {currentUser?.role === 'admin' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Organización
                      </label>
                      <select
                        value={formData.tenantId}
                        onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        {tenants.map(tenant => (
                          <option key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {!selectedUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña temporal
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      minLength={8}
                      required
                    />
                  </div>
                )}

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permisos Específicos
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
                    {availablePermissions.map(permission => (
                      <label key={permission} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                permissions: [...formData.permissions, permission]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                permissions: formData.permissions.filter(p => p !== permission)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span>{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sendWelcomeEmail"
                    checked={formData.sendWelcomeEmail}
                    onChange={(e) => setFormData({ ...formData, sendWelcomeEmail: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="sendWelcomeEmail" className="text-sm text-gray-700">
                    Enviar email de bienvenida
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setSelectedUser(null);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {selectedUser ? (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Actualizar Usuario
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Crear Usuario
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
                  {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Badge className={getRoleColor(selectedUser.role)}>
                    {selectedUser.role}
                  </Badge>
                  <p className="text-xs text-gray-600 mt-1">Rol</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Badge className={getStatusColor(selectedUser.status)}>
                    {selectedUser.status}
                  </Badge>
                  <p className="text-xs text-gray-600 mt-1">Estado</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedUser.metadata.loginCount}</p>
                  <p className="text-xs text-gray-600">Inicios de sesión</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                  <p className="text-xs text-gray-600">Miembro desde</p>
                </div>
              </div>

              {/* Statistics */}
              {(selectedUser.learningStats || selectedUser.instructorStats) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">📊 Estadísticas</h4>
                  {selectedUser.learningStats && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedUser.learningStats.coursesEnrolled}
                        </p>
                        <p className="text-sm text-gray-600">Cursos Inscritos</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {selectedUser.learningStats.coursesCompleted}
                        </p>
                        <p className="text-sm text-gray-600">Completados</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {selectedUser.learningStats.totalStudyHours}h
                        </p>
                        <p className="text-sm text-gray-600">Horas de Estudio</p>
                      </div>
                    </div>
                  )}
                  {selectedUser.instructorStats && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-indigo-50 rounded-lg">
                        <p className="text-2xl font-bold text-indigo-600">
                          {selectedUser.instructorStats.coursesCreated}
                        </p>
                        <p className="text-sm text-gray-600">Cursos Creados</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">
                          {selectedUser.instructorStats.studentsCount}
                        </p>
                        <p className="text-sm text-gray-600">Estudiantes</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">
                          ⭐ {selectedUser.instructorStats.averageRating}
                        </p>
                        <p className="text-sm text-gray-600">Calificación</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Permissions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">🔐 Permisos</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedUser.permissions.map(permission => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Metadata */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">ℹ️ Información Técnica</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Última actividad:</span>
                    <span className="text-sm font-medium">
                      {getTimeAgo(selectedUser.metadata.lastActivity)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">IP Address:</span>
                    <span className="text-sm font-mono">{selectedUser.metadata.ipAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">User Agent:</span>
                    <span className="text-sm font-mono truncate max-w-xs">
                      {selectedUser.metadata.userAgent}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUserDetails(false);
                    setSelectedUser(null);
                  }}
                >
                  Cerrar
                </Button>
                {hasPermission('user:edit') && (
                  <Button
                    onClick={() => {
                      setShowUserDetails(false);
                      setShowCreateForm(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Usuario
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

export default UserManagement;