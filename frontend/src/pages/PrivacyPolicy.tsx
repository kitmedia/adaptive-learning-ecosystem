/**
 * Privacy Policy Page - GDPR Compliant
 * Adaptive Learning Ecosystem - EbroValley Digital
 */

import React from 'react';
import { Shield, Lock, Eye, UserCheck, Database, Globe, Mail, Phone } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  const lastUpdated = '10 de Julio de 2025';
  const companyInfo = {
    name: 'EbroValley Digital S.L.',
    address: 'Calle Principal 123, 50001 Zaragoza, España',
    email: 'privacy@ebrovalley.digital',
    phone: '+34 976 123 456',
    dpo: 'dpo@ebrovalley.digital'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center mb-6">
            <Shield className="h-8 w-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Política de Privacidad</h1>
          </div>
          <p className="text-gray-600">
            Última actualización: <strong>{lastUpdated}</strong>
          </p>
          <p className="mt-4 text-gray-700">
            En <strong>{companyInfo.name}</strong>, nos comprometemos a proteger tu privacidad y a cumplir 
            con el Reglamento General de Protección de Datos (RGPD) y la legislación española de protección de datos.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Índice</h2>
          <nav className="space-y-2">
            <a href="#responsable" className="block text-primary-600 hover:text-primary-700">1. Responsable del Tratamiento</a>
            <a href="#datos-recopilados" className="block text-primary-600 hover:text-primary-700">2. Datos que Recopilamos</a>
            <a href="#finalidad" className="block text-primary-600 hover:text-primary-700">3. Finalidad del Tratamiento</a>
            <a href="#base-legal" className="block text-primary-600 hover:text-primary-700">4. Base Legal</a>
            <a href="#destinatarios" className="block text-primary-600 hover:text-primary-700">5. Destinatarios</a>
            <a href="#derechos" className="block text-primary-600 hover:text-primary-700">6. Tus Derechos</a>
            <a href="#seguridad" className="block text-primary-600 hover:text-primary-700">7. Seguridad</a>
            <a href="#cookies" className="block text-primary-600 hover:text-primary-700">8. Cookies</a>
            <a href="#menores" className="block text-primary-600 hover:text-primary-700">9. Menores de Edad</a>
            <a href="#cambios" className="block text-primary-600 hover:text-primary-700">10. Cambios en la Política</a>
          </nav>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* 1. Responsable del Tratamiento */}
          <section id="responsable" className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <UserCheck className="h-6 w-6 text-primary-600 mr-3" />
              1. Responsable del Tratamiento
            </h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Razón Social:</strong> {companyInfo.name}</p>
              <p><strong>CIF:</strong> B12345678</p>
              <p><strong>Domicilio:</strong> {companyInfo.address}</p>
              <p><strong>Email:</strong> <a href={`mailto:${companyInfo.email}`} className="text-primary-600 hover:text-primary-700">{companyInfo.email}</a></p>
              <p><strong>Teléfono:</strong> {companyInfo.phone}</p>
              <p><strong>DPO (Delegado de Protección de Datos):</strong> <a href={`mailto:${companyInfo.dpo}`} className="text-primary-600 hover:text-primary-700">{companyInfo.dpo}</a></p>
            </div>
          </section>

          {/* 2. Datos que Recopilamos */}
          <section id="datos-recopilados" className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Database className="h-6 w-6 text-primary-600 mr-3" />
              2. Datos que Recopilamos
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">2.1 Datos de Identificación</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Nombre y apellidos</li>
                  <li>Dirección de correo electrónico</li>
                  <li>Nombre de usuario</li>
                  <li>Fotografía de perfil (opcional)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">2.2 Datos de Uso</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Progreso de aprendizaje</li>
                  <li>Cursos completados</li>
                  <li>Resultados de evaluaciones</li>
                  <li>Tiempo de estudio</li>
                  <li>Preferencias de aprendizaje</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2.3 Datos Técnicos</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Dirección IP</li>
                  <li>Tipo de navegador</li>
                  <li>Sistema operativo</li>
                  <li>Cookies y tecnologías similares</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2.4 Datos de Pago</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Información de facturación</li>
                  <li>Historial de transacciones</li>
                  <li>Los datos de tarjetas son procesados directamente por Stripe (no almacenamos números de tarjetas)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Finalidad del Tratamiento */}
          <section id="finalidad" className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Eye className="h-6 w-6 text-primary-600 mr-3" />
              3. Finalidad del Tratamiento
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>Utilizamos tus datos personales para:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Prestación del servicio:</strong> Proporcionar acceso a nuestra plataforma de aprendizaje adaptativo</li>
                <li><strong>Personalización:</strong> Adaptar el contenido educativo a tu ritmo y estilo de aprendizaje</li>
                <li><strong>Comunicación:</strong> Enviarte notificaciones sobre tu progreso, actualizaciones del servicio</li>
                <li><strong>Mejora del servicio:</strong> Analizar el uso de la plataforma para mejorar la experiencia</li>
                <li><strong>Facturación:</strong> Gestionar pagos y suscripciones</li>
                <li><strong>Cumplimiento legal:</strong> Cumplir con obligaciones legales y fiscales</li>
                <li><strong>Marketing:</strong> Enviarte información sobre nuevos cursos (solo con tu consentimiento)</li>
              </ul>
            </div>
          </section>

          {/* 4. Base Legal */}
          <section id="base-legal" className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Lock className="h-6 w-6 text-primary-600 mr-3" />
              4. Base Legal para el Tratamiento
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>Las bases legales para el tratamiento de tus datos son:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Ejecución de contrato:</strong> Para la prestación de nuestros servicios educativos</li>
                <li><strong>Consentimiento:</strong> Para el envío de comunicaciones comerciales y uso de cookies no esenciales</li>
                <li><strong>Interés legítimo:</strong> Para la mejora de nuestros servicios y prevención del fraude</li>
                <li><strong>Obligación legal:</strong> Para cumplir con obligaciones fiscales y legales</li>
              </ul>
            </div>
          </section>

          {/* 5. Destinatarios */}
          <section id="destinatarios" className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Globe className="h-6 w-6 text-primary-600 mr-3" />
              5. Destinatarios de los Datos
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>Compartimos tus datos únicamente con:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Stripe:</strong> Para el procesamiento seguro de pagos</li>
                <li><strong>Google Analytics:</strong> Para análisis de uso (datos anonimizados)</li>
                <li><strong>AWS/Google Cloud:</strong> Para almacenamiento seguro en la nube</li>
                <li><strong>Autoridades:</strong> Cuando sea requerido por ley</li>
              </ul>
              <p className="mt-4">
                <strong>Transferencias internacionales:</strong> Algunos proveedores pueden estar ubicados fuera 
                del EEE. En estos casos, garantizamos que existen garantías adecuadas (cláusulas contractuales tipo, 
                Privacy Shield, etc.).
              </p>
            </div>
          </section>

          {/* 6. Tus Derechos */}
          <section id="derechos" className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <UserCheck className="h-6 w-6 text-primary-600 mr-3" />
              6. Tus Derechos RGPD
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700">Tienes derecho a:</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-primary-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Acceso</h3>
                  <p className="text-sm text-gray-700">Obtener confirmación sobre si estamos tratando tus datos y acceder a ellos</p>
                </div>
                
                <div className="bg-primary-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Rectificación</h3>
                  <p className="text-sm text-gray-700">Solicitar la corrección de datos inexactos o incompletos</p>
                </div>
                
                <div className="bg-primary-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Supresión</h3>
                  <p className="text-sm text-gray-700">Solicitar la eliminación de tus datos cuando ya no sean necesarios</p>
                </div>
                
                <div className="bg-primary-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Limitación</h3>
                  <p className="text-sm text-gray-700">Solicitar la limitación del tratamiento en determinadas circunstancias</p>
                </div>
                
                <div className="bg-primary-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Portabilidad</h3>
                  <p className="text-sm text-gray-700">Recibir tus datos en formato estructurado y de uso común</p>
                </div>
                
                <div className="bg-primary-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Oposición</h3>
                  <p className="text-sm text-gray-700">Oponerte al tratamiento de tus datos en determinadas situaciones</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>¿Cómo ejercer tus derechos?</strong> Puedes ejercer estos derechos enviando un email a{' '}
                  <a href={`mailto:${companyInfo.dpo}`} className="text-primary-600 hover:text-primary-700">{companyInfo.dpo}</a>
                  {' '}con tu solicitud y una copia de tu DNI.
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  También tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD).
                </p>
              </div>
            </div>
          </section>

          {/* 7. Seguridad */}
          <section id="seguridad" className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Shield className="h-6 w-6 text-primary-600 mr-3" />
              7. Medidas de Seguridad
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>Implementamos medidas técnicas y organizativas apropiadas para proteger tus datos:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Cifrado de datos en tránsito (TLS/SSL) y en reposo</li>
                <li>Autenticación de dos factores disponible</li>
                <li>Acceso restringido basado en roles</li>
                <li>Auditorías de seguridad regulares</li>
                <li>Formación del personal en protección de datos</li>
                <li>Políticas de retención y eliminación segura</li>
                <li>Planes de respuesta ante incidentes</li>
              </ul>
            </div>
          </section>

          {/* 8. Cookies */}
          <section id="cookies" className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-4">8. Política de Cookies</h2>
            <p className="text-gray-700">
              Utilizamos cookies y tecnologías similares para mejorar tu experiencia. Puedes gestionar 
              tus preferencias de cookies en cualquier momento desde la configuración de cookies en el pie de página.
            </p>
            <p className="mt-3 text-gray-700">
              Para más información, consulta nuestra{' '}
              <a href="/cookie-policy" className="text-primary-600 hover:text-primary-700">Política de Cookies completa</a>.
            </p>
          </section>

          {/* 9. Menores */}
          <section id="menores" className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-4">9. Menores de Edad</h2>
            <p className="text-gray-700">
              Nuestros servicios están dirigidos a mayores de 16 años. Si eres menor de 16 años, 
              necesitas el consentimiento de tus padres o tutores legales para utilizar nuestra plataforma.
            </p>
          </section>

          {/* 10. Cambios */}
          <section id="cambios" className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-4">10. Cambios en la Política</h2>
            <p className="text-gray-700">
              Podemos actualizar esta política ocasionalmente. Te notificaremos sobre cambios significativos 
              por email o mediante un aviso destacado en nuestra plataforma. La fecha de "última actualización" 
              en la parte superior indica cuándo se revisó por última vez.
            </p>
          </section>
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-primary-50 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">¿Tienes preguntas?</h2>
          <p className="text-gray-700 mb-6">
            Si tienes cualquier pregunta sobre esta política de privacidad o sobre cómo tratamos tus datos, 
            no dudes en contactarnos:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-primary-600 mr-3" />
              <div>
                <p className="font-semibold">Email DPO</p>
                <a href={`mailto:${companyInfo.dpo}`} className="text-primary-600 hover:text-primary-700">
                  {companyInfo.dpo}
                </a>
              </div>
            </div>
            <div className="flex items-center">
              <Phone className="h-5 w-5 text-primary-600 mr-3" />
              <div>
                <p className="font-semibold">Teléfono</p>
                <p className="text-gray-700">{companyInfo.phone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;