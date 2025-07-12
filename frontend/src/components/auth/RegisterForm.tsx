import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle,
  UserPlus
} from 'lucide-react';
import { sanitizeUserInput, sanitizeText } from '../../utils/sanitize';

interface RegisterFormData {
  // Step 1: Basic Info
  username: string;
  email: string;
  fullName: string;
  
  // Step 2: Password & Security
  password: string;
  confirmPassword: string;
  
  // Step 3: Preferences
  role: 'student' | 'teacher';
  interests: string[];
  agreeToTerms: boolean;
}

interface RegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onBackToLogin?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onError, onBackToLogin }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    interests: [],
    agreeToTerms: false
  });

  const availableInterests = [
    'Inteligencia Artificial',
    'Desarrollo Web',
    'Ciencia de Datos',
    'Machine Learning',
    'Programación',
    'Diseño UX/UI',
    'Marketing Digital',
    'Matemáticas',
    'Idiomas',
    'Emprendimiento'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let finalValue: any = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    // Sanitize input based on field type
    if (type !== 'checkbox' && typeof finalValue === 'string') {
      switch (name) {
        case 'username':
          finalValue = sanitizeUserInput(finalValue, 'username');
          break;
        case 'email':
          finalValue = sanitizeUserInput(finalValue, 'email');
          break;
        case 'fullName':
          finalValue = sanitizeText(finalValue, 100);
          break;
        case 'password':
        case 'confirmPassword':
          finalValue = sanitizeUserInput(finalValue, 'password');
          break;
        default:
          finalValue = sanitizeText(finalValue);
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (step === 1) {
      if (!formData.username.trim()) {
        newErrors.username = 'El nombre de usuario es requerido';
      } else if (formData.username.length < 3) {
        newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
      }

      if (!formData.email.trim()) {
        newErrors.email = 'El email es requerido';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Por favor ingresa un email válido';
      }

      if (!formData.fullName.trim()) {
        newErrors.fullName = 'El nombre completo es requerido';
      }
    }

    if (step === 2) {
      if (!formData.password.trim()) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }

      if (!formData.confirmPassword.trim()) {
        newErrors.confirmPassword = 'Confirma tu contraseña';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    if (step === 3) {
      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = 'Debes aceptar los términos y condiciones';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would make the actual API call
      console.log('Registration data:', formData);
      
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en el registro';
      setErrors({ submit: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <User className="h-8 w-8 text-primary-600" />
        </div>
        <h3 className="heading-3 mb-2">Información Básica</h3>
        <p className="text-body">Cuéntanos sobre ti para personalizar tu experiencia</p>
      </div>

      {/* Username */}
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
              errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="tu_usuario_unico"
          />
        </div>
        {errors.username && (
          <p className="text-sm text-red-600">{errors.username}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
          Correo Electrónico
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
              errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="tu@email.com"
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700">
          Nombre Completo
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
            errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          placeholder="Tu Nombre Completo"
        />
        {errors.fullName && (
          <p className="text-sm text-red-600">{errors.fullName}</p>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <Lock className="h-8 w-8 text-primary-600" />
        </div>
        <h3 className="heading-3 mb-2">Seguridad</h3>
        <p className="text-body">Crea una contraseña segura para proteger tu cuenta</p>
      </div>

      {/* Password */}
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
              errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Mínimo 6 caracteres"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? 
              <EyeOff className="h-5 w-5 text-gray-400" /> : 
              <Eye className="h-5 w-5 text-gray-400" />
            }
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
          Confirmar Contraseña
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
              errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Repite tu contraseña"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showConfirmPassword ? 
              <EyeOff className="h-5 w-5 text-gray-400" /> : 
              <Eye className="h-5 w-5 text-gray-400" />
            }
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Password Strength Indicator */}
      <div className="space-y-2">
        <div className="text-sm text-gray-600">Fortaleza de la contraseña:</div>
        <div className="flex space-x-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`h-2 flex-1 rounded-full ${
                formData.password.length >= level * 2
                  ? level <= 2 ? 'bg-red-400' : level === 3 ? 'bg-yellow-400' : 'bg-green-400'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <div className="text-xs text-gray-500">
          {formData.password.length < 6 ? 'Muy débil' :
           formData.password.length < 8 ? 'Débil' :
           formData.password.length < 10 ? 'Moderada' : 'Fuerte'}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <UserPlus className="h-8 w-8 text-primary-600" />
        </div>
        <h3 className="heading-3 mb-2">Personalización</h3>
        <p className="text-body">Personaliza tu experiencia de aprendizaje</p>
      </div>

      {/* Role Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          ¿Cuál es tu rol?
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, role: 'student' }))}
            className={`p-4 border-2 rounded-lg text-center transition-all ${
              formData.role === 'student'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="text-2xl mb-2">👩‍🎓</div>
            <div className="font-medium">Estudiante</div>
            <div className="text-sm text-gray-500">Quiero aprender</div>
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, role: 'teacher' }))}
            className={`p-4 border-2 rounded-lg text-center transition-all ${
              formData.role === 'teacher'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="text-2xl mb-2">👨‍🏫</div>
            <div className="font-medium">Profesor</div>
            <div className="text-sm text-gray-500">Quiero enseñar</div>
          </button>
        </div>
      </div>

      {/* Interests */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          Áreas de Interés (opcional)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {availableInterests.map((interest) => (
            <button
              key={interest}
              type="button"
              onClick={() => handleInterestToggle(interest)}
              className={`p-2 text-sm border rounded-lg transition-all ${
                formData.interests.includes(interest)
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Selecciona las áreas que te interesan para recibir contenido personalizado
        </p>
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-4">
        <div className="flex items-start">
          <input
            id="agreeToTerms"
            name="agreeToTerms"
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
          />
          <label htmlFor="agreeToTerms" className="ml-3 block text-sm text-gray-700">
            Acepto los{' '}
            <button type="button" className="text-primary-600 hover:text-primary-500 font-medium">
              términos y condiciones
            </button>{' '}
            y la{' '}
            <button type="button" className="text-primary-600 hover:text-primary-500 font-medium">
              política de privacidad
            </button>
          </label>
        </div>
        {errors.agreeToTerms && (
          <p className="text-sm text-red-600">{errors.agreeToTerms}</p>
        )}
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{errors.submit}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card-professional p-8 animate-slide-up">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Paso {currentStep} de 3
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / 3) * 100)}% completado
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation Buttons */}
          <div className="mt-8 flex gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePreviousStep}
                className="btn-secondary flex items-center"
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="btn-primary flex-1 flex items-center justify-center"
              >
                <span>Siguiente</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || !formData.agreeToTerms}
                className="btn-primary flex-1 flex items-center justify-center disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creando cuenta...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Crear Cuenta
                  </div>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Back to Login */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-sm text-gray-600 hover:text-gray-500 font-medium"
            disabled={isLoading}
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;