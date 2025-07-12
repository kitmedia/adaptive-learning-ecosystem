/**
 * GDPR Cookie Consent - Adaptive Learning Ecosystem
 * EbroValley Digital - EU Compliance Implementation
 */

import React, { useState, useEffect } from 'react';
import { Cookie, Shield, Settings, X, Check, Info } from 'lucide-react';

export interface CookieCategory {
  id: string;
  name: string;
  description: string;
  essential: boolean;
  enabled: boolean;
  cookies: {
    name: string;
    purpose: string;
    duration: string;
    provider: string;
  }[];
}

export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: string;
  version: string;
}

interface CookieConsentProps {
  onConsentChange?: (consent: CookieConsent) => void;
  companyName?: string;
  policyUrl?: string;
}

const CookieConsentBanner: React.FC<CookieConsentProps> = ({
  onConsentChange,
  companyName = 'EbroValley Digital',
  policyUrl = '/privacy-policy'
}) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true, // Always true for essential cookies
    analytics: false,
    marketing: false,
    preferences: false,
    timestamp: '',
    version: '1.0'
  });

  const cookieCategories: CookieCategory[] = [
    {
      id: 'necessary',
      name: 'Cookies Esenciales',
      description: 'Estas cookies son necesarias para el funcionamiento básico del sitio web y no pueden ser desactivadas.',
      essential: true,
      enabled: true,
      cookies: [
        {
          name: 'session_token',
          purpose: 'Mantener la sesión del usuario autenticado',
          duration: 'Sesión',
          provider: 'EbroValley Digital'
        },
        {
          name: 'csrf_token',
          purpose: 'Protección contra ataques CSRF',
          duration: 'Sesión',
          provider: 'EbroValley Digital'
        },
        {
          name: 'consent_preferences',
          purpose: 'Recordar las preferencias de cookies del usuario',
          duration: '1 año',
          provider: 'EbroValley Digital'
        }
      ]
    },
    {
      id: 'analytics',
      name: 'Cookies de Análisis',
      description: 'Nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web.',
      essential: false,
      enabled: consent.analytics,
      cookies: [
        {
          name: '_ga',
          purpose: 'Distinguir usuarios únicos',
          duration: '2 años',
          provider: 'Google Analytics'
        },
        {
          name: '_gid',
          purpose: 'Distinguir usuarios únicos',
          duration: '24 horas',
          provider: 'Google Analytics'
        },
        {
          name: '_gat',
          purpose: 'Limitar la tasa de solicitudes',
          duration: '1 minuto',
          provider: 'Google Analytics'
        }
      ]
    },
    {
      id: 'marketing',
      name: 'Cookies de Marketing',
      description: 'Se utilizan para ofrecer contenido publicitario más relevante para ti.',
      essential: false,
      enabled: consent.marketing,
      cookies: [
        {
          name: '_fbp',
          purpose: 'Seguimiento de conversiones de Facebook',
          duration: '3 meses',
          provider: 'Facebook'
        },
        {
          name: '__stripe_sid',
          purpose: 'Seguimiento de transacciones de pago',
          duration: '30 minutos',
          provider: 'Stripe'
        }
      ]
    },
    {
      id: 'preferences',
      name: 'Cookies de Preferencias',
      description: 'Permiten al sitio web recordar información que cambia la forma en que se comporta.',
      essential: false,
      enabled: consent.preferences,
      cookies: [
        {
          name: 'user_language',
          purpose: 'Recordar el idioma preferido del usuario',
          duration: '1 año',
          provider: 'EbroValley Digital'
        },
        {
          name: 'theme_preference',
          purpose: 'Recordar el tema visual preferido',
          duration: '1 año',
          provider: 'EbroValley Digital'
        }
      ]
    }
  ];

  useEffect(() => {
    // Check if consent has been given before
    const savedConsent = localStorage.getItem('cookie_consent');
    if (!savedConsent) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(savedConsent);
        setConsent(parsed);
        onConsentChange?.(parsed);
      } catch (error) {
        console.error('Error parsing saved consent:', error);
        setShowBanner(true);
      }
    }
  }, [onConsentChange]);

  const saveConsent = (newConsent: CookieConsent) => {
    const consentWithTimestamp = {
      ...newConsent,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('cookie_consent', JSON.stringify(consentWithTimestamp));
    setConsent(consentWithTimestamp);
    onConsentChange?.(consentWithTimestamp);
    setShowBanner(false);
    setShowDetails(false);

    // Apply consent settings
    applyConsentSettings(consentWithTimestamp);
  };

  const applyConsentSettings = (consentSettings: CookieConsent) => {
    // Google Analytics
    if (consentSettings.analytics) {
      // Enable Google Analytics
      (window as any).gtag?.('consent', 'update', {
        analytics_storage: 'granted'
      });
    } else {
      // Disable Google Analytics
      (window as any).gtag?.('consent', 'update', {
        analytics_storage: 'denied'
      });
    }

    // Marketing cookies
    if (consentSettings.marketing) {
      (window as any).gtag?.('consent', 'update', {
        ad_storage: 'granted'
      });
    } else {
      (window as any).gtag?.('consent', 'update', {
        ad_storage: 'denied'
      });
    }

    // Remove cookies if consent is withdrawn
    if (!consentSettings.analytics) {
      // Remove Google Analytics cookies
      const gaCookies = ['_ga', '_gid', '_gat', '_gat_gtag_'];
      gaCookies.forEach(cookie => {
        document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
    }

    if (!consentSettings.marketing) {
      // Remove marketing cookies
      const marketingCookies = ['_fbp', '_fbc', '__stripe_sid'];
      marketingCookies.forEach(cookie => {
        document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
    }
  };

  const handleAcceptAll = () => {
    const fullConsent: CookieConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      timestamp: '',
      version: '1.0'
    };
    saveConsent(fullConsent);
  };

  const handleRejectAll = () => {
    const minimalConsent: CookieConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: '',
      version: '1.0'
    };
    saveConsent(minimalConsent);
  };

  const handleCustomSave = () => {
    saveConsent(consent);
  };

  const handleCategoryToggle = (categoryId: keyof CookieConsent) => {
    if (categoryId === 'necessary') return; // Can't disable necessary cookies
    
    setConsent(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-primary-500 shadow-2xl">
        <div className="max-w-7xl mx-auto p-6">
          {!showDetails ? (
            // Simple Banner
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start">
                <Cookie className="h-6 w-6 text-primary-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Uso de Cookies
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Utilizamos cookies para mejorar tu experiencia, analizar el tráfico del sitio 
                    y personalizar el contenido. Al hacer clic en "Aceptar todo", consientes el uso 
                    de todas las cookies.{' '}
                    <a 
                      href={policyUrl} 
                      className="text-primary-600 hover:text-primary-700 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Leer más en nuestra política de privacidad
                    </a>
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                <button
                  onClick={() => setShowDetails(true)}
                  className="flex items-center justify-center px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Personalizar
                </button>
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Rechazar Todo
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex items-center justify-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Aceptar Todo
                </button>
              </div>
            </div>
          ) : (
            // Detailed Settings
            <div className="max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Shield className="h-6 w-6 text-primary-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Configuración de Cookies
                  </h3>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {cookieCategories.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <h4 className="text-lg font-medium text-gray-900">
                          {category.name}
                        </h4>
                        {category.essential && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            Esencial
                          </span>
                        )}
                      </div>
                      
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={category.essential ? true : consent[category.id as keyof CookieConsent] as boolean}
                          onChange={() => handleCategoryToggle(category.id as keyof CookieConsent)}
                          disabled={category.essential}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${
                          (category.essential || consent[category.id as keyof CookieConsent])
                            ? 'bg-primary-600'
                            : 'bg-gray-300'
                        }`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${
                            (category.essential || consent[category.id as keyof CookieConsent])
                              ? 'translate-x-6'
                              : 'translate-x-1'
                          }`} />
                        </div>
                      </label>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">
                      {category.description}
                    </p>

                    <div className="space-y-2">
                      {category.cookies.map((cookie, index) => (
                        <details key={index} className="group">
                          <summary className="flex items-center cursor-pointer text-sm text-gray-700 hover:text-gray-900">
                            <Info className="h-4 w-4 mr-2" />
                            <span className="font-medium">{cookie.name}</span>
                            <span className="ml-auto text-xs text-gray-500">
                              {cookie.provider}
                            </span>
                          </summary>
                          <div className="mt-2 ml-6 text-xs text-gray-600 space-y-1">
                            <p><strong>Propósito:</strong> {cookie.purpose}</p>
                            <p><strong>Duración:</strong> {cookie.duration}</p>
                            <p><strong>Proveedor:</strong> {cookie.provider}</p>
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Rechazar Todo
                </button>
                <button
                  onClick={handleCustomSave}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Guardar Preferencias
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors"
                >
                  Aceptar Todo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CookieConsentBanner;