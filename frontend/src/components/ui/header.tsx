import React, { useState } from 'react';
import { Bell, Settings, User, Search, Shield, ChevronDown } from 'lucide-react';
import SearchBar from './search-bar';

interface HeaderProps {
  currentPage: string;
  setCurrentPage: (page: 'dashboard' | 'diagnostic' | 'assessment' | 'gamification' | 'pricing' | 'privacy' | 'gdpr-rights' | 'security-test' | 'content-management') => void;
  userName?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  currentPage, 
  setCurrentPage, 
  userName = "Ana Estudiante" 
}) => {
  const [showGdprDropdown, setShowGdprDropdown] = useState(false);
  return (
    <header className="relative overflow-hidden bg-white shadow-sm border-b border-gray-200">
      {/* Professional header background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-secondary-50"></div>
      
      <div className="relative z-10 container-professional py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Logo & Company Branding */}
          <div className="flex items-center gap-4">
            <img 
              src="/logo.svg" 
              alt="Adaptive Learning Ecosystem" 
              className="h-12 w-auto"
            />
            <div className="hidden sm:block">
              <div className="text-sm text-gray-500 font-medium">
                Plataforma de Aprendizaje Inteligente
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex flex-wrap gap-2">
            <button 
              onClick={() => setCurrentPage('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                currentPage === 'dashboard' 
                  ? 'bg-primary-500 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-primary-50 hover:text-primary-700 border border-gray-200'
              }`}
            >
              📊 Dashboard
            </button>
            <button 
              onClick={() => setCurrentPage('diagnostic')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                currentPage === 'diagnostic' 
                  ? 'bg-primary-500 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-primary-50 hover:text-primary-700 border border-gray-200'
              }`}
            >
              🧠 Diagnóstico AI
            </button>
            <button 
              onClick={() => setCurrentPage('assessment')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                currentPage === 'assessment' 
                  ? 'bg-primary-500 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-primary-50 hover:text-primary-700 border border-gray-200'
              }`}
            >
              📝 Evaluaciones
            </button>
            <button 
              onClick={() => setCurrentPage('gamification')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                currentPage === 'gamification' 
                  ? 'bg-primary-500 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-primary-50 hover:text-primary-700 border border-gray-200'
              }`}
            >
              🏆 Logros
            </button>
            <button 
              onClick={() => setCurrentPage('pricing')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                currentPage === 'pricing' 
                  ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md' 
                  : 'bg-gradient-to-r from-accent-50 to-accent-100 text-accent-700 hover:from-accent-100 hover:to-accent-200 border border-accent-200'
              }`}
            >
              💎 Planes
            </button>
            <button 
              onClick={() => setCurrentPage('content-management')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                currentPage === 'content-management' 
                  ? 'bg-green-500 text-white shadow-md' 
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              }`}
            >
              📚 Gestión de Contenidos
            </button>
          </nav>
          
          {/* User Actions */}
          <div className="flex items-center gap-3">
            {/* Search for mobile */}
            <div className="lg:hidden">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Search className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            
            {/* GDPR & Privacy Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowGdprDropdown(!showGdprDropdown)}
                className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Shield className="h-5 w-5 text-gray-600" />
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
              
              {showGdprDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowGdprDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setCurrentPage('privacy');
                          setShowGdprDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        📄 Política de Privacidad
                      </button>
                      <button
                        onClick={() => {
                          setCurrentPage('gdpr-rights');
                          setShowGdprDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        🛡️ Gestión de Datos RGPD
                      </button>
                      <button
                        onClick={() => {
                          localStorage.removeItem('cookie_consent');
                          window.location.reload();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        🍪 Configurar Cookies
                      </button>
                      {import.meta.env.DEV && (
                        <button
                          onClick={() => {
                            setCurrentPage('security-test');
                            setShowGdprDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-yellow-700 hover:bg-yellow-50 flex items-center gap-2 border-t border-gray-100"
                        >
                          🔒 Test Seguridad (DEV)
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Settings */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="h-5 w-5 text-gray-600" />
            </button>
            
            {/* User Profile */}
            <div className="flex items-center gap-2 ml-2">
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium text-gray-900">{userName}</div>
                <div className="text-xs text-gray-500">Estudiante</div>
              </div>
              <button className="flex items-center justify-center w-8 h-8 bg-primary-500 rounded-full text-white font-medium hover:bg-primary-600 transition-colors">
                <User className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;