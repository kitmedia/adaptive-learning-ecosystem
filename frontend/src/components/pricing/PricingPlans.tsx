import React, { useState } from 'react';
import { 
  Check, 
  Star, 
  Zap, 
  Crown, 
  ArrowRight,
  Users,
  MessageSquare,
  BarChart3,
  Shield,
  Headphones,
  Cloud
} from 'lucide-react';

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing: 'monthly' | 'annual';
  popular?: boolean;
  features: string[];
  limitations?: string[];
  icon: React.ReactNode;
  description: string;
  cta: string;
  stripePriceId?: string;
}

interface PricingPlansProps {
  onPlanSelect?: (plan: PricingPlan) => void;
  currentPlan?: string;
}

const PricingPlans: React.FC<PricingPlansProps> = ({ onPlanSelect, currentPlan }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const monthlyPlans: PricingPlan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 9,
      currency: '€',
      billing: 'monthly',
      icon: <Users className="h-6 w-6" />,
      description: 'Perfecto para estudiantes que empiezan',
      cta: 'Comenzar con Basic',
      stripePriceId: 'price_basic_monthly',
      features: [
        'Acceso a cursos básicos',
        'Progreso tracking personal',
        'Hasta 3 cursos simultáneos',
        'Soporte por email',
        'Certificados de finalización',
        'Acceso móvil y web'
      ],
      limitations: [
        'Sin acceso a contenido premium',
        'Sin mentorías 1:1',
        'Soporte limitado'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      currency: '€',
      billing: 'monthly',
      popular: true,
      icon: <Zap className="h-6 w-6" />,
      description: 'Ideal para profesionales en crecimiento',
      cta: 'Upgrade a Pro',
      stripePriceId: 'price_pro_monthly',
      features: [
        'Todo lo de Basic',
        'Acceso completo a contenido premium',
        'Cursos ilimitados',
        'Mentorías grupales semanales',
        'Analytics avanzados de progreso',
        'Proyectos prácticos guiados',
        'Soporte prioritario 24/7',
        'Acceso a comunidad exclusiva',
        'Descarga de contenido offline'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      currency: '€',
      billing: 'monthly',
      icon: <Crown className="h-6 w-6" />,
      description: 'Para empresas y teams de alto rendimiento',
      cta: 'Contactar Ventas',
      stripePriceId: 'price_enterprise_monthly',
      features: [
        'Todo lo de Pro',
        'Mentorías 1:1 personalizadas',
        'Contenido corporativo exclusivo',
        'Dashboard administrativo completo',
        'API access para integraciones',
        'Onboarding personalizado',
        'Account manager dedicado',
        'Reportes ejecutivos',
        'SLA garantizado 99.9%',
        'Integración SSO/SAML',
        'Auditorías de seguridad'
      ]
    }
  ];

  const annualPlans: PricingPlan[] = monthlyPlans.map(plan => ({
    ...plan,
    billing: 'annual',
    price: Math.round(plan.price * 10), // 2 meses gratis
    stripePriceId: plan.stripePriceId?.replace('monthly', 'annual')
  }));

  const currentPlans = billingCycle === 'monthly' ? monthlyPlans : annualPlans;

  const handlePlanSelect = async (plan: PricingPlan) => {
    setIsLoading(plan.id);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onPlanSelect?.(plan);
    } catch (error) {
      console.error('Error selecting plan:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const calculateSavings = (monthlyPrice: number) => {
    const annualPrice = monthlyPrice * 10;
    const monthlyCost = monthlyPrice * 12;
    const savings = monthlyCost - annualPrice;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return { amount: savings, percentage };
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="heading-1 mb-4">
          Planes que se adaptan a tu{' '}
          <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            crecimiento
          </span>
        </h2>
        <p className="text-body text-lg max-w-2xl mx-auto">
          Desde estudiantes individuales hasta empresas completas. 
          Encuentra el plan perfecto para acelerar tu aprendizaje.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center mb-12">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2 rounded-md text-sm font-semibold transition-all relative ${
              billingCycle === 'annual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Anual
            <span className="absolute -top-2 -right-2 bg-secondary-500 text-white text-xs px-2 py-1 rounded-full">
              -17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {currentPlans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const isPopular = plan.popular;
          const isPlanLoading = isLoading === plan.id;
          const savings = billingCycle === 'annual' ? calculateSavings(plan.price / 10) : null;

          return (
            <div
              key={`${plan.id}-${billingCycle}`}
              className={`relative card-professional p-8 ${
                isPopular 
                  ? 'ring-2 ring-primary-500 scale-105 z-10' 
                  : isCurrentPlan
                  ? 'ring-2 ring-secondary-500'
                  : ''
              } transition-all duration-300 hover:shadow-lg`}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center shadow-lg">
                    <Star className="h-4 w-4 mr-1" />
                    Más Popular
                  </div>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute top-4 right-4">
                  <div className="bg-secondary-100 text-secondary-800 px-3 py-1 rounded-full text-xs font-semibold">
                    Plan Actual
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  isPopular ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {plan.icon}
                </div>
                
                <h3 className="heading-3 mb-2">{plan.name}</h3>
                <p className="text-body text-sm">{plan.description}</p>
              </div>

              {/* Pricing */}
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.currency}{plan.price}
                  </span>
                  <span className="text-gray-600 ml-2">
                    /{billingCycle === 'monthly' ? 'mes' : 'año'}
                  </span>
                </div>
                
                {billingCycle === 'annual' && savings && (
                  <div className="text-sm text-secondary-600 font-medium">
                    Ahorras {plan.currency}{savings.amount} al año ({savings.percentage}%)
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="mb-8">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <Check className="h-5 w-5 text-secondary-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.limitations && plan.limitations.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Limitaciones
                    </h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="text-xs text-gray-500 flex items-start">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handlePlanSelect(plan)}
                disabled={isCurrentPlan || isPlanLoading}
                className={`w-full flex items-center justify-center py-3 px-6 rounded-lg font-semibold transition-all ${
                  isCurrentPlan
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : isPopular
                    ? 'btn-primary'
                    : 'btn-secondary hover:btn-primary'
                }`}
              >
                {isPlanLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                    Procesando...
                  </div>
                ) : isCurrentPlan ? (
                  'Plan Actual'
                ) : (
                  <div className="flex items-center">
                    <span>{plan.cta}</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Additional Features */}
      <div className="mt-16 text-center">
        <h3 className="heading-3 mb-8">Todos los planes incluyen</h3>
        <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 text-primary-600 rounded-lg mb-4">
              <Shield className="h-6 w-6" />
            </div>
            <h4 className="font-semibold mb-2">Seguridad Total</h4>
            <p className="text-sm text-gray-600">Cifrado end-to-end y cumplimiento GDPR</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary-100 text-secondary-600 rounded-lg mb-4">
              <Headphones className="h-6 w-6" />
            </div>
            <h4 className="font-semibold mb-2">Soporte Experto</h4>
            <p className="text-sm text-gray-600">Equipo especializado en educación</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-accent-100 text-accent-600 rounded-lg mb-4">
              <Cloud className="h-6 w-6" />
            </div>
            <h4 className="font-semibold mb-2">Sync Multi-dispositivo</h4>
            <p className="text-sm text-gray-600">Acceso desde cualquier lugar</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-4">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h4 className="font-semibold mb-2">Analytics Detallados</h4>
            <p className="text-sm text-gray-600">Insights de tu progreso de aprendizaje</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h3 className="heading-3 text-center mb-8">Preguntas Frecuentes</h3>
        <div className="space-y-6">
          <div className="card-professional p-6">
            <h4 className="font-semibold mb-2">¿Puedo cambiar de plan en cualquier momento?</h4>
            <p className="text-sm text-gray-600">
              Sí, puedes actualizar o degradar tu plan cuando quieras. Los cambios se aplican 
              inmediatamente y se ajusta la facturación de forma proporcional.
            </p>
          </div>
          
          <div className="card-professional p-6">
            <h4 className="font-semibold mb-2">¿Hay periodo de prueba gratuito?</h4>
            <p className="text-sm text-gray-600">
              Todos los planes incluyen 14 días de prueba gratuita. No se requiere tarjeta 
              de crédito para empezar.
            </p>
          </div>
          
          <div className="card-professional p-6">
            <h4 className="font-semibold mb-2">¿Qué métodos de pago aceptan?</h4>
            <p className="text-sm text-gray-600">
              Aceptamos todas las tarjetas principales (Visa, Mastercard, Amex), PayPal, 
              transferencias bancarias y Bizum para España.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;