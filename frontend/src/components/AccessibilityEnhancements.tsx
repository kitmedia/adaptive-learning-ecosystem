import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Volume2, Contrast, Type, Palette, Settings } from 'lucide-react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  audioDescriptions: boolean;
  keyboardNavigation: boolean;
  colorBlindFriendly: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  theme: 'light' | 'dark' | 'auto';
}

interface AccessibilityEnhancementsProps {
  onSettingsChange?: (settings: AccessibilitySettings) => void;
}

const AccessibilityEnhancements: React.FC<AccessibilityEnhancementsProps> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    screenReader: false,
    audioDescriptions: false,
    keyboardNavigation: true,
    colorBlindFriendly: false,
    fontSize: 'medium',
    theme: 'auto'
  });
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Load accessibility settings from localStorage
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      applyAccessibilitySettings(parsed);
    }

    // Listen for keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        setShowAccessibilityPanel(prev => !prev);
      }
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        toggleHighContrast();
      }
      if (e.altKey && e.key === 't') {
        e.preventDefault();
        cycleFontSize();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencies intentionally omitted - only run on mount

  const updateSetting = (key: keyof AccessibilitySettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));
    applyAccessibilitySettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const applyAccessibilitySettings = (accessibilitySettings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // High contrast
    if (accessibilitySettings.highContrast) {
      root.classList.add('accessibility-high-contrast');
    } else {
      root.classList.remove('accessibility-high-contrast');
    }

    // Large text
    if (accessibilitySettings.largeText) {
      root.classList.add('accessibility-large-text');
    } else {
      root.classList.remove('accessibility-large-text');
    }

    // Reduce motion
    if (accessibilitySettings.reduceMotion) {
      root.classList.add('accessibility-reduce-motion');
    } else {
      root.classList.remove('accessibility-reduce-motion');
    }

    // Color blind friendly
    if (accessibilitySettings.colorBlindFriendly) {
      root.classList.add('accessibility-colorblind-friendly');
    } else {
      root.classList.remove('accessibility-colorblind-friendly');
    }

    // Font size
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-xl');
    root.classList.add(`font-size-${accessibilitySettings.fontSize}`);

    // Theme
    if (accessibilitySettings.theme === 'dark') {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
    }
  };

  const toggleHighContrast = () => {
    updateSetting('highContrast', !settings.highContrast);
  };

  const cycleFontSize = () => {
    const sizes: AccessibilitySettings['fontSize'][] = ['small', 'medium', 'large', 'xl'];
    const currentIndex = sizes.indexOf(settings.fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    updateSetting('fontSize', sizes[nextIndex]);
  };

  const announceToScreenReader = (message: string) => {
    if (settings.screenReader) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    }
  };

  // Accessibility floating button
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        aria-label="Mostrar opciones de accesibilidad"
        title="Presiona Alt+A para abrir panel de accesibilidad"
      >
        <Eye className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Accessibility Panel */}
      {showAccessibilityPanel && (
        <div className="mb-4 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-6 w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-blue-600" />
              Accesibilidad
            </h3>
            <button
              onClick={() => setShowAccessibilityPanel(false)}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Cerrar panel de accesibilidad"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {/* Contraste Alto */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Contrast className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Alto Contraste</span>
              </div>
              <button
                onClick={toggleHighContrast}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.highContrast ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                aria-label={`${settings.highContrast ? 'Desactivar' : 'Activar'} alto contraste`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                }`}></div>
              </button>
            </div>

            {/* Tamaño de Texto */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Type className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Tamaño de Texto</span>
              </div>
              <select
                value={settings.fontSize}
                onChange={(e) => updateSetting('fontSize', e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2"
                aria-label="Seleccionar tamaño de texto"
              >
                <option value="small">Pequeño</option>
                <option value="medium">Mediano</option>
                <option value="large">Grande</option>
                <option value="xl">Extra Grande</option>
              </select>
            </div>

            {/* Reducir Movimiento */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Reducir Movimiento</span>
              </div>
              <button
                onClick={() => updateSetting('reduceMotion', !settings.reduceMotion)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.reduceMotion ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                aria-label={`${settings.reduceMotion ? 'Desactivar' : 'Activar'} reducir movimiento`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.reduceMotion ? 'translate-x-6' : 'translate-x-1'
                }`}></div>
              </button>
            </div>

            {/* Amigable para Daltónicos */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Modo Daltónico</span>
              </div>
              <button
                onClick={() => updateSetting('colorBlindFriendly', !settings.colorBlindFriendly)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.colorBlindFriendly ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                aria-label={`${settings.colorBlindFriendly ? 'Desactivar' : 'Activar'} modo daltónico`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.colorBlindFriendly ? 'translate-x-6' : 'translate-x-1'
                }`}></div>
              </button>
            </div>

            {/* Lector de Pantalla */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Lector de Pantalla</span>
              </div>
              <button
                onClick={() => {
                  updateSetting('screenReader', !settings.screenReader);
                  announceToScreenReader('Lector de pantalla ' + (!settings.screenReader ? 'activado' : 'desactivado'));
                }}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.screenReader ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                aria-label={`${settings.screenReader ? 'Desactivar' : 'Activar'} lector de pantalla`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.screenReader ? 'translate-x-6' : 'translate-x-1'
                }`}></div>
              </button>
            </div>

            {/* Tema */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Tema</span>
              </div>
              <select
                value={settings.theme}
                onChange={(e) => updateSetting('theme', e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2"
                aria-label="Seleccionar tema"
              >
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="auto">Automático</option>
              </select>
            </div>
          </div>

          {/* Atajos de Teclado */}
          <div className="mt-6 p-3 bg-blue-50 rounded-xl">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Atajos de Teclado</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <div>Alt + A: Abrir/cerrar panel</div>
              <div>Alt + C: Alto contraste</div>
              <div>Alt + T: Cambiar tamaño texto</div>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility Button */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowAccessibilityPanel(!showAccessibilityPanel)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Abrir opciones de accesibilidad"
          title="Presiona Alt+A para abrir"
        >
          <Settings className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => setIsVisible(false)}
          className="bg-gray-600 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
          aria-label="Ocultar panel de accesibilidad"
        >
          <EyeOff className="h-5 w-5" />
        </button>
      </div>

      {/* Screen Reader Only Instructions */}
      <div className="sr-only">
        <p>Panel de accesibilidad disponible. Presiona Alt+A para abrir las opciones de accesibilidad.</p>
        <p>Presiona Alt+C para alternar alto contraste.</p>
        <p>Presiona Alt+T para cambiar el tamaño del texto.</p>
      </div>
    </div>
  );
};

export default AccessibilityEnhancements;