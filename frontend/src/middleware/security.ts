/**
 * Security Middleware - Adaptive Learning Ecosystem
 * EbroValley Digital - Production Security Layer
 */

export interface SecurityConfig {
  csp: {
    enabled: boolean;
    nonce?: string;
    reportUri?: string;
  };
  hsts: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  contentTypeOptions: boolean;
  referrerPolicy: string;
  permissionsPolicy: Record<string, string[]>;
}

export const defaultSecurityConfig: SecurityConfig = {
  csp: {
    enabled: true,
    reportUri: '/api/security/csp-report'
  },
  hsts: {
    enabled: true,
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameOptions: 'DENY',
  contentTypeOptions: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: ['self'],
    usb: [],
    bluetooth: [],
    magnetometer: [],
    gyroscope: [],
    accelerometer: []
  }
};

export class SecurityHeaders {
  private config: SecurityConfig;

  constructor(config: SecurityConfig = defaultSecurityConfig) {
    this.config = config;
  }

  /**
   * Generate Content Security Policy header value
   */
  generateCSP(): string {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://analytics.google.com https://www.googletagmanager.com https://connect.facebook.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: http:",
      "media-src 'self' blob: https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
      "frame-ancestors 'none'",
      "connect-src 'self' https://api.stripe.com https://analytics.google.com https://www.google-analytics.com",
      "worker-src 'self' blob:",
      "child-src 'self'",
      "manifest-src 'self'",
      "upgrade-insecure-requests"
    ];

    if (this.config.csp.nonce) {
      cspDirectives[1] = cspDirectives[1].replace("'unsafe-inline'", `'nonce-${this.config.csp.nonce}'`);
    }

    if (this.config.csp.reportUri) {
      cspDirectives.push(`report-uri ${this.config.csp.reportUri}`);
    }

    return cspDirectives.join('; ');
  }

  /**
   * Generate HSTS header value
   */
  generateHSTS(): string {
    const { maxAge, includeSubDomains, preload } = this.config.hsts;
    let hsts = `max-age=${maxAge}`;
    
    if (includeSubDomains) {
      hsts += '; includeSubDomains';
    }
    
    if (preload) {
      hsts += '; preload';
    }
    
    return hsts;
  }

  /**
   * Generate Permissions Policy header value
   */
  generatePermissionsPolicy(): string {
    const policies = [];
    
    for (const [directive, allowlist] of Object.entries(this.config.permissionsPolicy)) {
      if (allowlist.length === 0) {
        policies.push(`${directive}=()`);
      } else {
        const formatted = allowlist.map(origin => origin === 'self' ? 'self' : `"${origin}"`).join(' ');
        policies.push(`${directive}=(${formatted})`);
      }
    }
    
    return policies.join(', ');
  }

  /**
   * Get all security headers as object
   */
  getAllHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Content Security Policy
    if (this.config.csp.enabled) {
      headers['Content-Security-Policy'] = this.generateCSP();
    }

    // HTTP Strict Transport Security
    if (this.config.hsts.enabled) {
      headers['Strict-Transport-Security'] = this.generateHSTS();
    }

    // X-Frame-Options
    headers['X-Frame-Options'] = this.config.frameOptions;

    // X-Content-Type-Options
    if (this.config.contentTypeOptions) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    // Referrer Policy
    headers['Referrer-Policy'] = this.config.referrerPolicy;

    // Permissions Policy
    headers['Permissions-Policy'] = this.generatePermissionsPolicy();

    // Additional security headers
    headers['X-XSS-Protection'] = '1; mode=block';
    headers['X-DNS-Prefetch-Control'] = 'off';
    headers['X-Download-Options'] = 'noopen';
    headers['X-Permitted-Cross-Domain-Policies'] = 'none';

    // Cross-Origin policies
    headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
    headers['Cross-Origin-Opener-Policy'] = 'same-origin';
    headers['Cross-Origin-Resource-Policy'] = 'same-origin';

    return headers;
  }

  /**
   * Generate security headers for Netlify _headers file
   */
  generateNetlifyHeaders(): string {
    const headers = this.getAllHeaders();
    const lines = ['# Security Headers for Adaptive Learning Ecosystem', '/*'];
    
    for (const [name, value] of Object.entries(headers)) {
      lines.push(`  ${name}: ${value}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Generate security headers for Apache .htaccess
   */
  generateApacheHeaders(): string {
    const headers = this.getAllHeaders();
    const lines = ['# Security Headers for Adaptive Learning Ecosystem'];
    
    for (const [name, value] of Object.entries(headers)) {
      lines.push(`Header always set ${name} "${value}"`);
    }
    
    return lines.join('\n');
  }

  /**
   * Generate security headers for Nginx
   */
  generateNginxHeaders(): string {
    const headers = this.getAllHeaders();
    const lines = ['# Security Headers for Adaptive Learning Ecosystem'];
    
    for (const [name, value] of Object.entries(headers)) {
      lines.push(`add_header ${name} "${value}" always;`);
    }
    
    return lines.join('\n');
  }

  /**
   * Validate current security configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate HSTS max-age
    if (this.config.hsts.enabled && this.config.hsts.maxAge < 300) {
      errors.push('HSTS max-age should be at least 300 seconds');
    }

    // Validate CSP report URI
    if (this.config.csp.reportUri && !this.config.csp.reportUri.startsWith('/')) {
      errors.push('CSP report URI should be a relative path');
    }

    // Validate frame options
    const validFrameOptions = ['DENY', 'SAMEORIGIN', 'ALLOW-FROM'];
    if (!validFrameOptions.includes(this.config.frameOptions)) {
      errors.push('Invalid frame options value');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Initialize security headers with environment-specific config
 */
export const initSecurity = (environment: 'development' | 'production' = 'production'): SecurityHeaders => {
  const config = { ...defaultSecurityConfig };

  if (environment === 'development') {
    // Relax CSP for development
    config.csp.enabled = false;
    config.hsts.enabled = false;
  }

  return new SecurityHeaders(config);
};

/**
 * CSP violation reporting handler
 */
export const handleCSPViolation = (violation: CSPViolationReport): void => {
  console.warn('CSP Violation detected:', {
    documentUri: violation['document-uri'],
    violatedDirective: violation['violated-directive'],
    blockedUri: violation['blocked-uri'],
    lineNumber: violation['line-number'],
    sourceFile: violation['source-file']
  });

  // In production, send to monitoring service
  if (import.meta.env.PROD) {
    fetch('/api/security/csp-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(violation)
    }).catch(error => {
      console.error('Failed to report CSP violation:', error);
    });
  }
};

/**
 * CSP Violation Report interface
 */
export interface CSPViolationReport {
  'document-uri': string;
  'referrer': string;
  'violated-directive': string;
  'effective-directive': string;
  'original-policy': string;
  'blocked-uri': string;
  'line-number': number;
  'column-number': number;
  'source-file': string;
  'status-code': number;
  'script-sample': string;
}

// Export configured security instance
export const security = initSecurity(
  import.meta.env.PROD ? 'production' : 'development'
);