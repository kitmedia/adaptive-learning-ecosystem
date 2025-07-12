import React, { useState, Suspense, lazy } from 'react';
import Header from './components/ui/header';
import AccessibilityEnhancements from './components/AccessibilityEnhancements';
import CookieConsentBanner from './components/gdpr/CookieConsent';
import PerformanceOptimizer from './components/PerformanceOptimizer';
import ErrorBoundary from './components/ErrorBoundary';
import { useMonitoring } from './hooks/useMonitoring';

// Lazy-loaded components for better code splitting
const DashboardProfessional = lazy(() => import('./pages/DashboardProfessional'));
const DiagnosticPage = lazy(() => import('./pages/DiagnosticPage'));
const AssessmentPage = lazy(() => import('./pages/AssessmentPage'));
const GamificationPage = lazy(() => import('./pages/GamificationPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const UserRightsManager = lazy(() => import('./components/gdpr/UserRightsManager'));
const XSSTestComponent = lazy(() => import('./components/security/XSSTestComponent'));
const PerformanceMonitor = lazy(() => import('./components/PerformanceMonitor'));
const MonitoringDashboard = lazy(() => import('./components/MonitoringDashboard'));
const ContentManagementDashboard = lazy(() => import('./components/ContentManagement/ContentManagementDashboard'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
      <p className="mt-2 text-sm text-gray-600">Cargando...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'diagnostic' | 'assessment' | 'gamification' | 'pricing' | 'privacy' | 'gdpr-rights' | 'security-test' | 'content-management'>('dashboard');
  
  // Initialize monitoring for the entire app
  const monitoring = useMonitoring({
    enableAutoTracking: true,
    trackUserActions: true,
    trackPerformance: true,
    trackErrors: true
  });

  return (
    <ErrorBoundary>
      <PerformanceOptimizer
        enableAutoOptimization={true}
        enableIntelligentPrefetch={true}
        enablePerformanceMonitoring={import.meta.env.DEV}
      >
        <Suspense fallback={<LoadingFallback />}>
          <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <Header 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        userName="Ana Estudiante"
      />
      
      {/* Main Content */}
      <main className="min-h-[calc(100vh-80px)]">
        {currentPage === 'dashboard' && <DashboardProfessional setCurrentPage={setCurrentPage} />}
        {currentPage === 'diagnostic' && <DiagnosticPage />}
        {currentPage === 'assessment' && <AssessmentPage />}
        {currentPage === 'gamification' && <GamificationPage />}
        {currentPage === 'pricing' && <PricingPage onBack={() => setCurrentPage('dashboard')} />}
        {currentPage === 'privacy' && <PrivacyPolicy />}
        {currentPage === 'gdpr-rights' && <UserRightsManager userId="demo_user_123" userName="Ana Estudiante" />}
        {currentPage === 'security-test' && <XSSTestComponent />}
        {currentPage === 'content-management' && <ContentManagementDashboard />}
      </main>
      
      {/* Professional Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container-professional py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-700 font-medium">
                Developed by <span className="text-primary-600 font-semibold">ToñoAdPAOS</span> & <span className="text-secondary-600 font-semibold">Claudio Supreme</span>
              </p>
              <p className="text-gray-500 text-sm mt-1">
                EbroValley Digital - "WE ARE THE DIGITALWORKINGCLASS" 💪
              </p>
            </div>
            <div className="flex flex-col lg:flex-row items-center gap-6">
              {/* System Status */}
              <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary-500 rounded-full animate-pulse"></div>
                  <span>AI-Tutor: Operativo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary-500 rounded-full animate-pulse"></div>
                  <span>API Gateway: Conectado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary-500 rounded-full animate-pulse"></div>
                  <span>Sistema: Funcional</span>
                </div>
              </div>
              
              {/* GDPR Links */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <button
                  onClick={() => setCurrentPage('privacy')}
                  className="text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Política de Privacidad
                </button>
                <button
                  onClick={() => setCurrentPage('gdpr-rights')}
                  className="text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Gestión de Datos
                </button>
                <button
                  className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
                  title="Configurar Cookies"
                  onClick={() => {
                    // Force show cookie banner
                    localStorage.removeItem('cookie_consent');
                    window.location.reload();
                  }}
                >
                  Configurar Cookies
                </button>
                {import.meta.env.DEV && (
                  <button
                    onClick={() => setCurrentPage('security-test')}
                    className="text-yellow-600 hover:text-yellow-700 transition-colors"
                    title="Development Only"
                  >
                    Test Seguridad
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Accessibility Enhancements */}
      <AccessibilityEnhancements />
      
      {/* GDPR Cookie Consent Banner */}
      <CookieConsentBanner 
        companyName="EbroValley Digital"
        policyUrl="/privacy-policy"
        onConsentChange={(consent) => {
          console.log('Cookie consent updated:', consent);
          // Here you would integrate with your analytics and marketing tools
        }}
      />
      
      {/* Performance Monitor (Development Only) */}
      {import.meta.env.DEV && (
        <PerformanceMonitor 
          enabled={true}
          position="bottom-right"
        />
      )}
      
      {/* Monitoring Dashboard (Development Only) */}
      {import.meta.env.DEV && (
        <MonitoringDashboard
          isVisible={true}
          position="floating"
          enableRealtimeUpdates={true}
        />
      )}
    </div>
        </Suspense>
      </PerformanceOptimizer>
    </ErrorBoundary>
  );
};

export default App;