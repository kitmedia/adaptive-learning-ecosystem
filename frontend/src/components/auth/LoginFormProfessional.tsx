import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, ArrowRight, Shield } from 'lucide-react';
import { authService, type LoginRequest } from '../../services/auth.service';
import { sanitizeUserInput } from '../../utils/sanitize';

interface LoginFormProfessionalProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const LoginFormProfessional: React.FC<LoginFormProfessionalProps> = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Sanitize input based on field type
    let sanitizedValue = value;
    if (name === 'username') {
      sanitizedValue = sanitizeUserInput(value, 'username');
    } else if (name === 'password') {
      sanitizedValue = sanitizeUserInput(value, 'password');
    }
    
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 3) {
      newErrors.password = 'La contraseña debe tener al menos 3 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await authService.login(formData);
      
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('lastUsername', formData.username);
      }
      
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Credenciales incorrectas';
      setErrors({ submit: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (userType: 'student' | 'admin') => {
    setIsLoading(true);
    setErrors({});

    const demoCredentials = {
      student: { username: 'ana_estudiante', password: 'demo123' },
      admin: { username: 'admin_demo', password: 'demo123' }
    };

    try {
      await authService.login(demoCredentials[userType]);
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en acceso demo';
      setErrors({ demo: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert('Funcionalidad en desarrollo. Para demo, usa: ana_estudiante / demo123');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card-professional p-8 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="heading-2 mb-2">Bienvenido de vuelta</h2>
          <p className="text-body">
            Ingresa a tu plataforma de aprendizaje inteligente
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
              Nombre de Usuario
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                  errors.username 
                    ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                    : 'border-gray-300 hover:border-gray-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder="Ingresa tu usuario"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
            {errors.username && (
              <p className="text-sm text-red-600 animate-fade-in">{errors.username}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                  errors.password 
                    ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                    : 'border-gray-300 hover:border-gray-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder="Ingresa tu contraseña"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? 
                  <EyeOff className="h-5 w-5 text-gray-400" /> : 
                  <Eye className="h-5 w-5 text-gray-400" />
                }
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 animate-fade-in">{errors.password}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Recordarme
              </label>
            </div>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-primary-600 hover:text-primary-500 font-medium transition-colors"
              disabled={isLoading}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 animate-fade-in">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errors.submit}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !formData.username || !formData.password}
            className="btn-primary w-full flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Iniciando sesión...
              </div>
            ) : (
              <div className="flex items-center">
                <span>Iniciar Sesión</span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </button>
        </form>

        {/* Demo Access */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500 font-medium">Acceso Demo</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleDemoLogin('student')}
              disabled={isLoading}
              className="btn-secondary text-sm flex items-center justify-center"
            >
              👩‍🎓 Estudiante
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              disabled={isLoading}
              className="btn-secondary text-sm flex items-center justify-center"
            >
              👨‍💼 Admin
            </button>
          </div>

          {errors.demo && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4 animate-fade-in">
              <p className="text-sm text-red-700">{errors.demo}</p>
            </div>
          )}
        </div>

        {/* Demo Info */}
        <div className="mt-8 p-4 bg-primary-50 rounded-lg border border-primary-200">
          <h4 className="text-sm font-semibold text-primary-900 mb-2">
            ℹ️ Información de Demo
          </h4>
          <div className="text-xs text-primary-700 space-y-1">
            <p><strong>Estudiante:</strong> ana_estudiante / demo123</p>
            <p><strong>Admin:</strong> admin_demo / demo123</p>
            <p className="pt-2 text-primary-600">
              💡 Usa los botones de acceso rápido para probar la plataforma
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginFormProfessional;