import React, { useState } from 'react';
import PricingPlans, { type PricingPlan } from '../components/pricing/PricingPlans';
import CheckoutPage from './CheckoutPage';
import { ArrowLeft, CheckCircle, Star } from 'lucide-react';

interface PricingPageProps {
  onBack?: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onBack }) => {
  const [currentView, setCurrentView] = useState<'pricing' | 'checkout' | 'success'>('pricing');
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [paymentId, setPaymentId] = useState<string>('');

  const handlePlanSelect = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setCurrentView('checkout');
  };

  const handleBackToPricing = () => {
    setCurrentView('pricing');
    setSelectedPlan(null);
  };

  const handlePaymentSuccess = (id: string) => {
    setPaymentId(id);
    setCurrentView('success');
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // Error is handled in CheckoutPage
  };

  const handleBackToDashboard = () => {
    onBack?.();
  };

  if (currentView === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="card-professional p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h1 className="heading-2 mb-4">¡Pago Completado!</h1>
            <p className="text-body mb-6">
              Tu suscripción al plan <strong>{selectedPlan?.name}</strong> ha sido activada exitosamente.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Detalles de la Transacción</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Plan:</strong> {selectedPlan?.name}</p>
                <p><strong>Precio:</strong> {selectedPlan?.currency}{selectedPlan?.price}</p>
                <p><strong>Facturación:</strong> {selectedPlan?.billing === 'monthly' ? 'Mensual' : 'Anual'}</p>
                <p><strong>ID de Pago:</strong> {paymentId}</p>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleBackToDashboard}
                className="btn-primary w-full"
              >
                Ir al Dashboard
              </button>
              
              <button
                onClick={handleBackToPricing}
                className="btn-secondary w-full"
              >
                Ver Otros Planes
              </button>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                📧 Próximos Pasos
              </h4>
              <p className="text-xs text-blue-700">
                Recibirás un email de confirmación con los detalles de tu suscripción 
                y las instrucciones para empezar.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'checkout') {
    return (
      <CheckoutPage
        selectedPlan={selectedPlan || undefined}
        onBack={handleBackToPricing}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {onBack && (
          <div className="mb-8">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver al Dashboard
            </button>
          </div>
        )}

        <PricingPlans 
          onPlanSelect={handlePlanSelect}
          currentPlan="basic" // This would come from user context
        />

        {/* Trust Indicators */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="heading-3 mb-4">Únete a más de 10,000 estudiantes</h3>
            <p className="text-body">
              Profesionales de todo el mundo confían en nuestra plataforma para acelerar su crecimiento
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center card-professional p-6">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-sm text-gray-600 mb-4">
                "La mejor inversión que he hecho en mi carrera. Los cursos son increíbles 
                y el soporte es excepcional."
              </blockquote>
              <div className="font-semibold text-sm">María González</div>
              <div className="text-xs text-gray-500">Desarrolladora Senior en Google</div>
            </div>

            <div className="text-center card-professional p-6">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-sm text-gray-600 mb-4">
                "Conseguí mi trabajo soñado gracias a las habilidades que adquirí aquí. 
                La metodología adaptativa es revolucionaria."
              </blockquote>
              <div className="font-semibold text-sm">Carlos Ruiz</div>
              <div className="text-xs text-gray-500">Data Scientist en Microsoft</div>
            </div>

            <div className="text-center card-professional p-6">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-sm text-gray-600 mb-4">
                "Perfecto para equipos. Hemos mejorado la productividad de nuestro 
                departamento en un 40% usando esta plataforma."
              </blockquote>
              <div className="font-semibold text-sm">Ana Martín</div>
              <div className="text-xs text-gray-500">CTO en Startup Tech</div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center">
          <div className="card-professional p-8 max-w-2xl mx-auto">
            <h3 className="heading-2 mb-4">
              ¿Aún tienes dudas?
            </h3>
            <p className="text-body mb-6">
              Prueba nuestra plataforma gratis durante 14 días. Sin compromiso, 
              sin tarjeta de crédito requerida.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary">
                Comenzar Prueba Gratuita
              </button>
              <button className="btn-secondary">
                Agendar Demo Personalizada
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;