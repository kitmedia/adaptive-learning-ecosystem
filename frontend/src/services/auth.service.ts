/**
 * Authentication Service for Frontend
 * Adaptive Learning Ecosystem - EbroValley Digital
 * Gestión completa de autenticación JWT
 */

interface LoginRequest {
  username: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface LoginResponse {
  user: User;
  tokens: TokenPair;
  message: string;
}

interface AuthUser {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  private authState: AuthUser = {
    user: null,
    isAuthenticated: false,
    isLoading: true
  };
  private listeners: Array<(state: AuthUser) => void> = [];

  constructor() {
    this.initializeAuth();
  }

  /**
   * Acción específica: Inicializar estado de autenticación
   * Razón: Verificar tokens existentes al cargar la aplicación
   */
  private async initializeAuth(): Promise<void> {
    const tokens = this.getStoredTokens();
    
    if (tokens?.accessToken) {
      try {
        const isValid = await this.verifyToken(tokens.accessToken);
        if (isValid.valid && isValid.user) {
          this.setAuthState({
            user: isValid.user,
            isAuthenticated: true,
            isLoading: false
          });
          return;
        }
      } catch {
        console.log('Token verification failed, attempting refresh...');
      }

      // Try to refresh token if access token is invalid
      if (tokens.refreshToken) {
        try {
          await this.refreshTokens();
          return;
        } catch {
          console.log('Token refresh failed');
          this.clearStoredTokens();
        }
      }
    }

    this.setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  }

  /**
   * Acción específica: Login de usuario
   * Razón: Autenticar credenciales y obtener tokens
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }

    const data: LoginResponse = await response.json();
    
    // Store tokens
    this.storeTokens(data.tokens);
    
    // Update auth state
    this.setAuthState({
      user: data.user,
      isAuthenticated: true,
      isLoading: false
    });

    return data;
  }

  /**
   * Acción específica: Registro de nuevo usuario
   * Razón: Crear cuenta nueva en el sistema
   */
  async register(userData: RegisterRequest): Promise<{ user: User; message: string }> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Registration failed');
    }

    return await response.json();
  }

  /**
   * Acción específica: Logout del usuario
   * Razón: Cerrar sesión y limpiar tokens
   */
  async logout(): Promise<void> {
    const tokens = this.getStoredTokens();
    
    if (tokens?.refreshToken) {
      try {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
      } catch {
        console.log('Logout request failed, continuing with local cleanup');
      }
    }

    this.clearStoredTokens();
    this.setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  }

  /**
   * Acción específica: Renovar tokens de acceso
   * Razón: Mantener sesión activa automáticamente
   */
  async refreshTokens(): Promise<TokenPair> {
    const tokens = this.getStoredTokens();
    
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    this.storeTokens(data.tokens);
    
    return data.tokens;
  }

  /**
   * Acción específica: Verificar validez del token
   * Razón: Validar autenticación antes de requests
   */
  async verifyToken(token: string): Promise<{ valid: boolean; user?: User; message: string }> {
    const response = await fetch(`${this.baseUrl}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return await response.json();
  }

  /**
   * Acción específica: Generar token demo
   * Razón: Facilitar testing sin registro
   */
  async generateDemoToken(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/demo-token`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Demo token generation failed');
    }

    const data = await response.json();
    this.storeTokens(data.tokens);
    
    this.setAuthState({
      user: data.user,
      isAuthenticated: true,
      isLoading: false
    });
  }

  /**
   * Acción específica: Obtener token de acceso válido
   * Razón: Proporcionar token para requests autenticados
   */
  async getValidAccessToken(): Promise<string | null> {
    const tokens = this.getStoredTokens();
    
    if (!tokens?.accessToken) {
      return null;
    }

    // Check if token is still valid
    try {
      const verification = await this.verifyToken(tokens.accessToken);
      if (verification.valid) {
        return tokens.accessToken;
      }
    } catch {
      // Token might be expired, try to refresh
    }

    // Try to refresh token
    if (tokens.refreshToken) {
      try {
        const newTokens = await this.refreshTokens();
        return newTokens.accessToken;
      } catch {
        this.clearStoredTokens();
        this.setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
        return null;
      }
    }

    return null;
  }

  /**
   * Storage helpers
   */
  private storeTokens(tokens: TokenPair): void {
    localStorage.setItem('adaptive_auth_tokens', JSON.stringify(tokens));
  }

  private getStoredTokens(): TokenPair | null {
    const stored = localStorage.getItem('adaptive_auth_tokens');
    return stored ? JSON.parse(stored) : null;
  }

  private clearStoredTokens(): void {
    localStorage.removeItem('adaptive_auth_tokens');
  }

  /**
   * State management
   */
  private setAuthState(state: AuthUser): void {
    this.authState = state;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.authState));
  }

  /**
   * Public getters
   */
  getAuthState(): AuthUser {
    return { ...this.authState };
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  getCurrentUser(): User | null {
    return this.authState.user;
  }

  isLoading(): boolean {
    return this.authState.isLoading;
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: (state: AuthUser) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
export type { User, LoginRequest, RegisterRequest, AuthUser, TokenPair, LoginResponse };