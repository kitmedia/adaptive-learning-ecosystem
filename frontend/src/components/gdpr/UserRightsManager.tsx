/**
 * User Rights Manager - GDPR Self-Service Portal
 * Adaptive Learning Ecosystem - EbroValley Digital
 */

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Trash2, 
  Eye, 
  Edit, 
  Shield, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail
} from 'lucide-react';
import { gdprService, type GDPRRightsRequest, type UserDataExport } from '../../services/gdpr.service';

interface UserRightsManagerProps {
  userId: string;
  userName: string;
}

const UserRightsManager: React.FC<UserRightsManagerProps> = ({ userId, userName }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'export' | 'delete' | 'requests'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState<GDPRRightsRequest[]>([]);
  const [deletionEligibility, setDeletionEligibility] = useState<any>(null);

  useEffect(() => {
    loadUserRequests();
    checkDeletionEligibility();
  }, [userId]);

  const loadUserRequests = async () => {
    // In a real app, this would load actual requests from the backend
    setRequests([]);
  };

  const checkDeletionEligibility = async () => {
    try {
      const eligibility = await gdprService.checkDeletionEligibility(userId);
      setDeletionEligibility(eligibility);
    } catch (error) {
      console.error('Error checking deletion eligibility:', error);
    }
  };

  const handleDataExport = async (format: 'json' | 'csv') => {
    setIsLoading(true);
    try {
      const blob = await gdprService.downloadUserData(userId, format);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-export-${userId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log the request
      await gdprService.submitRightsRequest('access', `Data export in ${format} format`);
      await loadUserRequests();
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataDeletion = async (reason: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsLoading(true);
    try {
      await gdprService.requestDataDeletion(userId, reason);
      await gdprService.submitRightsRequest('erasure', reason);
      await loadUserRequests();
      
      alert('Solicitud de eliminación enviada. Recibirás un email de confirmación.');
    } catch (error) {
      console.error('Error requesting data deletion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRightsRequest = async (type: GDPRRightsRequest['requestType'], details: string) => {
    setIsLoading(true);
    try {
      await gdprService.submitRightsRequest(type, details);
      await loadUserRequests();
      
      alert('Solicitud enviada correctamente. Te contactaremos en un plazo máximo de 30 días.');
    } catch (error) {
      console.error('Error submitting rights request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Resumen', icon: Eye },
    { id: 'export', name: 'Exportar Datos', icon: Download },
    { id: 'delete', name: 'Eliminar Cuenta', icon: Trash2 },
    { id: 'requests', name: 'Mis Solicitudes', icon: FileText }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center mb-4">
          <Shield className="h-8 w-8 text-primary-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Privacidad</h1>
            <p className="text-gray-600">Controla tus datos personales y ejercita tus derechos RGPD</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Usuario: <strong>{userName}</strong> | ID: {userId}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Eye className="h-5 w-5 text-blue-600 mr-2" />
                    Tus Derechos RGPD
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>✓ Derecho de acceso a tus datos</li>
                    <li>✓ Derecho de rectificación</li>
                    <li>✓ Derecho de supresión ("derecho al olvido")</li>
                    <li>✓ Derecho de portabilidad</li>
                    <li>✓ Derecho de oposición</li>
                    <li>✓ Derecho de limitación del tratamiento</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Shield className="h-5 w-5 text-green-600 mr-2" />
                    Tu Privacidad
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Datos encriptados</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex justify-between">
                      <span>Acceso limitado</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex justify-between">
                      <span>Backups seguros</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex justify-between">
                      <span>Cumplimiento RGPD</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Política de Retención de Datos</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Datos de cuenta activa:</strong> Mientras la cuenta esté activa</p>
                    <p><strong>Datos de cuenta inactiva:</strong> 3 años</p>
                    <p><strong>Registros financieros:</strong> 7 años (obligación legal)</p>
                  </div>
                  <div>
                    <p><strong>Datos analíticos:</strong> 2 años</p>
                    <p><strong>Logs técnicos:</strong> 6 meses</p>
                    <p><strong>Consentimiento marketing:</strong> Hasta revocación</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Exportar Tus Datos</h3>
                <p className="text-gray-600 mb-6">
                  Descarga una copia completa de todos tus datos personales en el formato que prefieras.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">JSON</h4>
                  <p className="text-sm text-gray-600 mb-4">Formato estructurado para desarrolladores</p>
                  <button
                    onClick={() => handleDataExport('json')}
                    disabled={isLoading}
                    className="btn-primary w-full"
                  >
                    {isLoading ? 'Exportando...' : 'Descargar JSON'}
                  </button>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">CSV</h4>
                  <p className="text-sm text-gray-600 mb-4">Tabla compatible con Excel</p>
                  <button
                    onClick={() => handleDataExport('csv')}
                    disabled={isLoading}
                    className="btn-primary w-full"
                  >
                    {isLoading ? 'Exportando...' : 'Descargar CSV'}
                  </button>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">PDF</h4>
                  <p className="text-sm text-gray-600 mb-4">Documento legible para imprimir</p>
                  <button
                    onClick={() => handleDataExport('pdf')}
                    disabled={isLoading}
                    className="btn-primary w-full"
                  >
                    {isLoading ? 'Exportando...' : 'Descargar PDF'}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">¿Qué incluye la exportación?</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Datos personales (nombre, email, perfil)</li>
                  <li>• Progreso de aprendizaje y certificaciones</li>
                  <li>• Historial de actividad y estadísticas</li>
                  <li>• Preferencias y configuraciones</li>
                  <li>• Metadatos de exportación y políticas de retención</li>
                </ul>
              </div>
            </div>
          )}

          {/* Delete Tab */}
          {activeTab === 'delete' && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                  <h3 className="text-lg font-semibold text-red-900">Eliminar Cuenta Permanentemente</h3>
                </div>
                <p className="text-red-700 mb-4">
                  Esta acción eliminará permanentemente tu cuenta y todos los datos asociados. 
                  Algunos datos pueden conservarse durante el tiempo requerido por ley.
                </p>
              </div>

              {deletionEligibility && (
                <div className={`p-4 rounded-lg ${
                  deletionEligibility.eligible ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <h4 className="font-semibold mb-2">Estado de Elegibilidad</h4>
                  {deletionEligibility.eligible ? (
                    <p className="text-green-700">Tu cuenta puede ser eliminada inmediatamente.</p>
                  ) : (
                    <div>
                      <p className="text-yellow-700 mb-2">Tu cuenta no puede ser eliminada en este momento por:</p>
                      <ul className="list-disc list-inside text-yellow-700">
                        {deletionEligibility.reasons?.map((reason: string, index: number) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                      <p className="text-yellow-700 mt-2">
                        Fecha estimada de elegibilidad: {new Date(deletionEligibility.estimatedDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-semibold">¿Por qué quieres eliminar tu cuenta?</h4>
                <div className="space-y-2">
                  {[
                    'Ya no uso el servicio',
                    'Preocupaciones de privacidad',
                    'Cambio a otro proveedor',
                    'Problemas con el servicio',
                    'Otro motivo'
                  ].map((reason) => (
                    <label key={reason} className="flex items-center">
                      <input
                        type="radio"
                        name="deletionReason"
                        value={reason}
                        className="mr-3"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      const form = document.querySelector('input[name="deletionReason"]:checked') as HTMLInputElement;
                      const reason = form?.value || 'No especificado';
                      handleDataDeletion(reason);
                    }}
                    disabled={isLoading || !deletionEligibility?.eligible}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Procesando...' : 'Eliminar Mi Cuenta'}
                  </button>
                  
                  <button
                    onClick={() => handleRightsRequest('restriction', 'Solicito la limitación del tratamiento de mis datos')}
                    disabled={isLoading}
                    className="btn-secondary"
                  >
                    Solo Limitar Tratamiento
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Datos que se conservarán por obligación legal:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Registros de transacciones (7 años)</li>
                  <li>• Registros fiscales (7 años)</li>
                  <li>• Comunicaciones legales</li>
                  <li>• Logs de seguridad esenciales</li>
                </ul>
              </div>
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Historial de Solicitudes</h3>
                <p className="text-gray-600 mb-6">
                  Revisa todas tus solicitudes de derechos RGPD y su estado actual.
                </p>
              </div>

              {requests.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No has enviado ninguna solicitud aún.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold capitalize">{request.requestType}</h4>
                        <div className="flex items-center">
                          {request.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600 mr-1" />}
                          {request.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600 mr-1" />}
                          <span className={`text-sm ${
                            request.status === 'pending' ? 'text-yellow-600' : 
                            request.status === 'completed' ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{request.details}</p>
                      <p className="text-xs text-gray-500">
                        Enviado: {new Date(request.submittedAt).toLocaleDateString()}
                        {request.completedAt && ` | Completado: ${new Date(request.completedAt).toLocaleDateString()}`}
                      </p>
                      {request.response && (
                        <div className="mt-3 p-3 bg-white rounded border-l-4 border-blue-500">
                          <p className="text-sm">{request.response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">¿Necesitas ayuda?</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Si tienes preguntas sobre tus derechos o necesitas asistencia, contáctanos:
                </p>
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 text-blue-600 mr-2" />
                  <a href="mailto:dpo@ebrovalley.digital" className="text-blue-600 hover:text-blue-700">
                    dpo@ebrovalley.digital
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserRightsManager;