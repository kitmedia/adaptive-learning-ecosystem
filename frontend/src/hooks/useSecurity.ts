import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { security, handleCSPViolation, type CSPViolationReport } from '../middleware/security';

interface SecurityStatus {
  isSecure: boolean;
  score: number;
  threats: string[];
  recommendations: string[];
  lastCheck: Date;
}

interface SecurityConfig {
  enableCSP: boolean;
  enableXSSProtection: boolean;
  enableThreatMonitoring: boolean;
  reportingEndpoint: string;
}

export const useSecurity = (config: Partial<SecurityConfig> = {}) => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    isSecure: true,
    score: 100,
    threats: [],
    recommendations: [],
    lastCheck: new Date()
  });

  const [securityConfig] = useState<SecurityConfig>({
    enableCSP: true,
    enableXSSProtection: true,
    enableThreatMonitoring: true,
    reportingEndpoint: '/api/security/violations',
    ...config
  });

  const handleSecurityViolation = useCallback((violation: CSPViolationReport) => {
    setSecurityStatus(prev => ({
      ...prev,
      threats: [...prev.threats, `CSP Violation: ${violation['violated-directive']}`],
      score: Math.max(prev.score - 10, 0),
      lastCheck: new Date()
    }));

    if (violation['violated-directive'].includes('script-src')) {
      setSecurityStatus(prev => ({ ...prev, isSecure: false }));
    }
  }, []);

  const assessSecurity = useCallback(async (): Promise<SecurityStatus> => {
    const assessment: SecurityStatus = {
      isSecure: true,
      score: 100,
      threats: [],
      recommendations: [],
      lastCheck: new Date()
    };

    try {
      const response = await fetch(window.location.href, { 
        method: 'HEAD',
        cache: 'no-cache'
      });

      const headers = {
        csp: response.headers.get('content-security-policy'),
        hsts: response.headers.get('strict-transport-security'),
        xframe: response.headers.get('x-frame-options'),
        xcontent: response.headers.get('x-content-type-options'),
        xss: response.headers.get('x-xss-protection')
      };

      if (!headers.csp) {
        assessment.recommendations.push('Implement Content Security Policy');
        assessment.score -= 20;
      }

      if (!headers.hsts && location.protocol === 'https:') {
        assessment.recommendations.push('Implement HSTS headers');
        assessment.score -= 15;
      }

      if (!headers.xframe) {
        assessment.recommendations.push('Implement X-Frame-Options');
        assessment.score -= 10;
      }

    } catch (error) {
      assessment.threats.push('Unable to verify security headers');
      assessment.score -= 5;
    }

    assessment.isSecure = assessment.score >= 70;

    if (assessment.score < 100) {
      assessment.recommendations.push('Review and strengthen security configuration');
    }

    return assessment;
  }, []);

  const startThreatMonitoring = useCallback(() => {
    if (!securityConfig.enableThreatMonitoring) return;

    document.addEventListener('securitypolicyviolation', (event) => {
      handleCSPViolation(event as any);
      handleSecurityViolation(event as any);
    });

    const detectXSS = () => {
      const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /eval\(/gi,
        /document\.write/gi
      ];

      const bodyContent = document.body.innerHTML;
      
      for (const pattern of xssPatterns) {
        if (pattern.test(bodyContent)) {
          setSecurityStatus(prev => ({
            ...prev,
            threats: [...prev.threats, `Potential XSS detected: ${pattern.source}`],
            score: Math.max(prev.score - 25, 0),
            isSecure: false,
            lastCheck: new Date()
          }));

          fetch('/api/security/threat-report', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'xss_detection',
              pattern: pattern.source,
              timestamp: new Date().toISOString()
            })
          }).catch(console.error);

          break;
        }
      }
    };

    const monitoringInterval = setInterval(detectXSS, 30000);

    return () => clearInterval(monitoringInterval);
  }, [securityConfig.enableThreatMonitoring, handleSecurityViolation]);

  useEffect(() => {
    const isHTTPS = location.protocol === 'https:';
    const isDev = import.meta.env.DEV;
    const isSecureConnection = isHTTPS || isDev;

    setSecurityStatus(prev => ({
      ...prev,
      isSecure: isSecureConnection
    }));

    assessSecurity().then(setSecurityStatus);

    const cleanup = startThreatMonitoring();

    return cleanup;
  }, [assessSecurity, startThreatMonitoring]);

  return {
    securityStatus,
    assessSecurity,
    isSecure: securityStatus.isSecure,
    securityScore: securityStatus.score,
    threats: securityStatus.threats,
    recommendations: securityStatus.recommendations
  };
};

interface SecurityProviderProps {
  children: ReactNode;
  enableViolationReporting?: boolean;
  enableThreatMonitoring?: boolean;
  reportingEndpoint?: string;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({
  children,
  enableViolationReporting = true,
  enableThreatMonitoring = true,
  reportingEndpoint = '/api/security/violations'
}) => {
  useEffect(() => {
    if (enableViolationReporting) {
      console.log('Security violation reporting enabled');
    }

    if (enableThreatMonitoring) {
      console.log('Security monitoring enabled');
    }

    (window as any).__SECURITY_CONFIG__ = {
      enabled: enableViolationReporting,
      endpoint: reportingEndpoint,
      monitoring: enableThreatMonitoring
    };
  }, [enableViolationReporting, enableThreatMonitoring, reportingEndpoint]);

  return React.createElement(React.Fragment, null, children);
};

export const SecurityValidation = {
  isUrlSafe: (url: string): boolean => {
    try {
      const parsed = new URL(url, location.origin);
      
      if (['javascript:', 'data:', 'vbscript:'].includes(parsed.protocol)) {
        return false;
      }

      return ['http:', 'https:', ''].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  isValidNonce: (nonce: string): boolean => {
    return /^[a-zA-Z0-9+/]+=*$/.test(nonce) && nonce.length >= 16;
  },

  hasXSSContent: (content: string): boolean => {
    const xssPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i
    ];

    return xssPatterns.some(pattern => pattern.test(content));
  }
};

export default useSecurity;