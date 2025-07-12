/**
 * Subscription Service
 * Adaptive Learning Ecosystem - EbroValley Digital
 * Gestión de suscripciones y facturación con Stripe
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing: 'monthly' | 'annual';
  stripePriceId: string;
  features: string[];
  limitations?: string[];
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
}

export interface BillingInfo {
  email: string;
  fullName: string;
  company?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  vatNumber?: string;
}

class SubscriptionService {
  private readonly API_BASE_URL: string;
  private readonly STRIPE_PUBLIC_KEY: string;

  constructor() {
    this.API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    this.STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_...';
  }

  /**
   * Obtener planes de suscripción disponibles
   */
  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/subscriptions/plans`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.plans || this.getMockPlans();
    } catch (error) {
      console.error('Error fetching plans:', error);
      // Fallback to mock data for demo
      return this.getMockPlans();
    }
  }

  /**
   * Obtener suscripción actual del usuario
   */
  async getCurrentSubscription(): Promise<UserSubscription | null> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/subscriptions/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No subscription found
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.subscription;
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      // Return mock subscription for demo
      return this.getMockSubscription();
    }
  }

  /**
   * Crear Payment Intent para Stripe
   */
  async createPaymentIntent(
    planId: string, 
    billingInfo: BillingInfo
  ): Promise<PaymentIntent> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/subscriptions/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          planId,
          billingInfo
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      // Return mock payment intent for demo
      return this.getMockPaymentIntent();
    }
  }

  /**
   * Confirmar pago y activar suscripción
   */
  async confirmPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/subscriptions/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethodId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        subscriptionId: data.subscriptionId
      };
    } catch (error) {
      console.error('Error confirming payment:', error);
      
      // Simulate payment for demo (90% success rate)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (Math.random() > 0.1) {
        return {
          success: true,
          subscriptionId: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      } else {
        return {
          success: false,
          error: 'Pago rechazado por el banco. Intenta con otra tarjeta.'
        };
      }
    }
  }

  /**
   * Cancelar suscripción
   */
  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return {
        success: false,
        error: 'Error al cancelar la suscripción'
      };
    }
  }

  /**
   * Cambiar plan de suscripción
   */
  async changePlan(
    subscriptionId: string, 
    newPlanId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/subscriptions/${subscriptionId}/change-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ newPlanId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error changing plan:', error);
      return {
        success: false,
        error: 'Error al cambiar el plan'
      };
    }
  }

  /**
   * Obtener historial de facturación
   */
  async getBillingHistory(): Promise<unknown[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/subscriptions/billing-history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.invoices || [];
    } catch (error) {
      console.error('Error fetching billing history:', error);
      return [];
    }
  }

  /**
   * Validar cupón de descuento
   */
  async validateCoupon(couponCode: string): Promise<{
    valid: boolean;
    discount?: number;
    discountType?: 'percentage' | 'amount';
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/subscriptions/validate-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ couponCode })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error validating coupon:', error);
      return {
        valid: false,
        error: 'Error validando el cupón'
      };
    }
  }

  // Métodos privados para obtener datos mock para demo

  private getMockPlans(): SubscriptionPlan[] {
    return [
      {
        id: 'basic',
        name: 'Basic',
        price: 9,
        currency: '€',
        billing: 'monthly',
        stripePriceId: 'price_basic_monthly',
        features: [
          'Acceso a cursos básicos',
          'Progreso tracking personal',
          'Hasta 3 cursos simultáneos',
          'Soporte por email',
          'Certificados de finalización'
        ],
        limitations: [
          'Sin acceso a contenido premium',
          'Sin mentorías 1:1'
        ]
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 29,
        currency: '€',
        billing: 'monthly',
        stripePriceId: 'price_pro_monthly',
        features: [
          'Todo lo de Basic',
          'Acceso completo a contenido premium',
          'Cursos ilimitados',
          'Mentorías grupales semanales',
          'Analytics avanzados de progreso',
          'Soporte prioritario 24/7'
        ]
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 99,
        currency: '€',
        billing: 'monthly',
        stripePriceId: 'price_enterprise_monthly',
        features: [
          'Todo lo de Pro',
          'Mentorías 1:1 personalizadas',
          'Contenido corporativo exclusivo',
          'Dashboard administrativo completo',
          'API access para integraciones',
          'Account manager dedicado'
        ]
      }
    ];
  }

  private getMockSubscription(): UserSubscription {
    return {
      id: 'sub_demo_12345',
      userId: 'user_demo',
      planId: 'basic',
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: 'sub_stripe_demo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private getMockPaymentIntent(): PaymentIntent {
    return {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientSecret: `pi_demo_secret_${Date.now()}`,
      amount: 2900, // 29.00 EUR in cents
      currency: 'eur',
      status: 'requires_confirmation'
    };
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}

export const subscriptionService = new SubscriptionService();