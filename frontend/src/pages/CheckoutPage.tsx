import React, { useState } from 'react';
import { sanitizeText, sanitizeUserInput } from '../utils/sanitize';
import { 
  ArrowLeft, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Lock,
  Smartphone,
  Mail
} from 'lucide-react';
import type { PricingPlan } from '../components/pricing/PricingPlans';

interface CheckoutPageProps {
  selectedPlan?: PricingPlan;
  onBack?: () => void;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bizum';
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface BillingInfo {
  email: string;
  fullName: string;
  company?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  vatNumber?: string;
}

interface CardInfo {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ 
  selectedPlan, 
  onBack, 
  onSuccess, 
  onError 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    email: '',
    fullName: '',
    company: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'ES',
    vatNumber: ''
  });

  const [cardInfo, setCardInfo] = useState<CardInfo>({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      type: 'card',
      name: 'Tarjeta de Crédito/Débito',
      icon: <CreditCard className="h-5 w-5" />,
      description: 'Visa, Mastercard, Amex'
    },
    {
      id: 'paypal',
      type: 'paypal',
      name: 'PayPal',
      icon: <div className="w-5 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">P</div>,
      description: 'Pago seguro con PayPal'
    },
    {
      id: 'bizum',
      type: 'bizum',
      name: 'Bizum',
      icon: <Smartphone className="h-5 w-5" />,
      description: 'Solo para España'
    }
  ];

  // Simulate plan fallback if none provided
  const plan = selectedPlan || {
    id: 'pro',
    name: 'Pro',
    price: 29,
    currency: '€',
    billing: 'monthly',
    icon: <CheckCircle className="h-6 w-6" />,
    description: 'Plan profesional completo',
    cta: 'Confirmar Pro',
    features: ['Acceso completo', 'Soporte 24/7']
  };

  const handleBillingInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Sanitize input based on field type
    let sanitizedValue = value;
    switch (name) {
      case 'email':
        sanitizedValue = sanitizeUserInput(value, 'email');
        break;
      case 'fullName':
        sanitizedValue = sanitizeText(value, 100);
        break;
      case 'company':
      case 'address':
      case 'city':
        sanitizedValue = sanitizeText(value, 200);
        break;
      case 'postalCode':
        sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
        break;
      case 'vatNumber':
        sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
        break;
      default:
        sanitizedValue = sanitizeText(value);
    }
    
    setBillingInfo(prev => ({ ...prev, [name]: sanitizedValue }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCardInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number (add spaces every 4 digits)
    if (name === 'number') {
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) formattedValue = formattedValue.slice(0, 19);
    }

    // Format expiry (MM/YY)
    if (name === 'expiry') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
      }
    }

    // Format CVC (3-4 digits)
    if (name === 'cvc') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    // Format cardholder name
    if (name === 'name') {
      formattedValue = sanitizeText(value, 50);
    }

    setCardInfo(prev => ({ ...prev, [name]: formattedValue }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateBillingInfo = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!billingInfo.email.trim()) {
      newErrors.email = 'Email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingInfo.email)) {
      newErrors.email = 'Email no válido';
    }

    if (!billingInfo.fullName.trim()) {
      newErrors.fullName = 'Nombre completo es requerido';
    }

    if (!billingInfo.address.trim()) {
      newErrors.address = 'Dirección es requerida';
    }

    if (!billingInfo.city.trim()) {
      newErrors.city = 'Ciudad es requerida';
    }

    if (!billingInfo.postalCode.trim()) {
      newErrors.postalCode = 'Código postal es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCardInfo = (): boolean => {
    if (selectedPaymentMethod !== 'card') return true;

    const newErrors: {[key: string]: string} = {};

    if (!cardInfo.number.replace(/\s/g, '')) {
      newErrors.number = 'Número de tarjeta es requerido';
    } else if (cardInfo.number.replace(/\s/g, '').length < 13) {
      newErrors.number = 'Número de tarjeta inválido';
    }

    if (!cardInfo.expiry) {
      newErrors.expiry = 'Fecha de vencimiento es requerida';
    } else if (!/^\d{2}\/\d{2}$/.test(cardInfo.expiry)) {
      newErrors.expiry = 'Formato inválido (MM/YY)';
    }

    if (!cardInfo.cvc) {
      newErrors.cvc = 'CVC es requerido';
    } else if (cardInfo.cvc.length < 3) {
      newErrors.cvc = 'CVC inválido';
    }

    if (!cardInfo.name.trim()) {
      newErrors.name = 'Nombre en la tarjeta es requerido';
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateBillingInfo()) {
        setCurrentStep(2);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePayment = async () => {
    if (!validateCardInfo()) {
      return;
    }

    setIsProcessing(true);
    setErrors({});

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulate success/failure (90% success rate)
      if (Math.random() > 0.1) {
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        onSuccess?.(paymentId);
      } else {
        throw new Error('Pago rechazado por el banco. Intenta con otra tarjeta.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error procesando el pago';
      setErrors({ payment: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateTotal = () => {
    const subtotal = plan.price;
    const tax = plan.billing === 'monthly' ? subtotal * 0.21 : subtotal * 0.21; // IVA 21%
    return {
      subtotal,
      tax,
      total: subtotal + tax
    };
  };

  const totals = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver a planes
          </button>
          
          <h1 className="heading-1">Finalizar Compra</h1>
          <p className="text-body mt-2">
            Estás a un paso de desbloquear todo tu potencial de aprendizaje
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Información de Facturación</span>
            </div>
            
            <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />
            
            <div className={`flex items-center ${currentStep >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Método de Pago</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="card-professional p-8">
              {currentStep === 1 && (
                <div>
                  <h2 className="heading-2 mb-6">Información de Facturación</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={billingInfo.email}
                          onChange={handleBillingInfoChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="tu@email.com"
                        />
                      </div>
                      {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={billingInfo.fullName}
                        onChange={handleBillingInfoChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Tu nombre completo"
                      />
                      {errors.fullName && <p className="text-sm text-red-600 mt-1">{errors.fullName}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-2">
                        Empresa (opcional)
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={billingInfo.company}
                        onChange={handleBillingInfoChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Nombre de tu empresa"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                        Dirección *
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={billingInfo.address}
                        onChange={handleBillingInfoChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.address ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Calle, número, piso..."
                      />
                      {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
                    </div>

                    <div>
                      <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={billingInfo.city}
                        onChange={handleBillingInfoChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.city ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Madrid"
                      />
                      {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city}</p>}
                    </div>

                    <div>
                      <label htmlFor="postalCode" className="block text-sm font-semibold text-gray-700 mb-2">
                        Código Postal *
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={billingInfo.postalCode}
                        onChange={handleBillingInfoChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.postalCode ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="28001"
                      />
                      {errors.postalCode && <p className="text-sm text-red-600 mt-1">{errors.postalCode}</p>}
                    </div>

                    <div>
                      <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
                        País *
                      </label>
                      <select
                        id="country"
                        name="country"
                        value={billingInfo.country}
                        onChange={handleBillingInfoChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="ES">España</option>
                        <option value="FR">Francia</option>
                        <option value="IT">Italia</option>
                        <option value="PT">Portugal</option>
                        <option value="DE">Alemania</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="vatNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                        NIF/CIF (opcional)
                      </label>
                      <input
                        type="text"
                        id="vatNumber"
                        name="vatNumber"
                        value={billingInfo.vatNumber}
                        onChange={handleBillingInfoChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="12345678A"
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={handleNextStep}
                      className="btn-primary px-8"
                    >
                      Continuar al Pago
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h2 className="heading-2 mb-6">Método de Pago</h2>
                  
                  {/* Payment Method Selection */}
                  <div className="mb-8">
                    <div className="grid gap-4">
                      {paymentMethods.map((method) => (
                        <label
                          key={method.id}
                          className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedPaymentMethod === method.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.id}
                            checked={selectedPaymentMethod === method.id}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                            className="sr-only"
                          />
                          <div className="flex items-center">
                            <div className="mr-4">{method.icon}</div>
                            <div>
                              <div className="font-semibold">{method.name}</div>
                              <div className="text-sm text-gray-600">{method.description}</div>
                            </div>
                          </div>
                          {selectedPaymentMethod === method.id && (
                            <CheckCircle className="absolute top-4 right-4 h-5 w-5 text-primary-500" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Card Details */}
                  {selectedPaymentMethod === 'card' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">Detalles de la Tarjeta</h3>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label htmlFor="cardNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                            Número de Tarjeta *
                          </label>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              type="text"
                              id="cardNumber"
                              name="number"
                              value={cardInfo.number}
                              onChange={handleCardInfoChange}
                              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                                errors.number ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                              placeholder="1234 5678 9012 3456"
                            />
                          </div>
                          {errors.number && <p className="text-sm text-red-600 mt-1">{errors.number}</p>}
                        </div>

                        <div>
                          <label htmlFor="expiry" className="block text-sm font-semibold text-gray-700 mb-2">
                            Vencimiento *
                          </label>
                          <input
                            type="text"
                            id="expiry"
                            name="expiry"
                            value={cardInfo.expiry}
                            onChange={handleCardInfoChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                              errors.expiry ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="MM/YY"
                          />
                          {errors.expiry && <p className="text-sm text-red-600 mt-1">{errors.expiry}</p>}
                        </div>

                        <div>
                          <label htmlFor="cvc" className="block text-sm font-semibold text-gray-700 mb-2">
                            CVC *
                          </label>
                          <input
                            type="text"
                            id="cvc"
                            name="cvc"
                            value={cardInfo.cvc}
                            onChange={handleCardInfoChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                              errors.cvc ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="123"
                          />
                          {errors.cvc && <p className="text-sm text-red-600 mt-1">{errors.cvc}</p>}
                        </div>

                        <div className="md:col-span-2">
                          <label htmlFor="cardName" className="block text-sm font-semibold text-gray-700 mb-2">
                            Nombre en la Tarjeta *
                          </label>
                          <input
                            type="text"
                            id="cardName"
                            name="name"
                            value={cardInfo.name}
                            onChange={handleCardInfoChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                              errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="Como aparece en tu tarjeta"
                          />
                          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PayPal Info */}
                  {selectedPaymentMethod === 'paypal' && (
                    <div className="text-center p-8 bg-blue-50 rounded-lg">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="text-white text-2xl font-bold">P</div>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">PayPal</h3>
                      <p className="text-gray-600">
                        Serás redirigido a PayPal para completar tu pago de forma segura.
                      </p>
                    </div>
                  )}

                  {/* Bizum Info */}
                  {selectedPaymentMethod === 'bizum' && (
                    <div className="text-center p-8 bg-green-50 rounded-lg">
                      <Smartphone className="w-16 h-16 text-green-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Bizum</h3>
                      <p className="text-gray-600">
                        Recibirás una notificación en tu móvil para autorizar el pago.
                      </p>
                    </div>
                  )}

                  {/* Error Display */}
                  {errors.payment && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
                        <p className="text-sm text-red-700">{errors.payment}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-8 flex gap-4">
                    <button
                      onClick={handlePreviousStep}
                      className="btn-secondary px-8"
                      disabled={isProcessing}
                    >
                      Atrás
                    </button>
                    
                    <button
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className="btn-primary flex-1 flex items-center justify-center"
                    >
                      {isProcessing ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Procesando Pago...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Lock className="h-5 w-5 mr-2" />
                          Pagar {plan.currency}{totals.total.toFixed(2)}
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="card-professional p-6 sticky top-8">
              <h3 className="heading-3 mb-6">Resumen del Pedido</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                    {plan.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{plan.name}</h4>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Facturación {plan.billing === 'monthly' ? 'mensual' : 'anual'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 mt-6 pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{plan.currency}{totals.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>IVA (21%)</span>
                  <span>{plan.currency}{totals.tax.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{plan.currency}{totals.total.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Facturado {plan.billing === 'monthly' ? 'mensualmente' : 'anualmente'}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-green-900">Pago 100% Seguro</h4>
                    <p className="text-xs text-green-700 mt-1">
                      Cifrado SSL y cumplimiento PCI DSS. Tus datos están protegidos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  ✅ Garantía de 30 días
                </h4>
                <p className="text-xs text-blue-700">
                  Si no estás satisfecho, te devolvemos el dinero sin preguntas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;