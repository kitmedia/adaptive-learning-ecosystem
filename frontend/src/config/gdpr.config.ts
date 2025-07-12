/**
 * GDPR Configuration - Adaptive Learning Ecosystem
 * EbroValley Digital - EU Compliance Configuration
 */

export const GDPR_CONFIG = {
  // Company Information
  company: {
    name: 'EbroValley Digital S.L.',
    address: 'Calle Principal 123, 50001 Zaragoza, España',
    cif: 'B12345678',
    email: 'privacy@ebrovalley.digital',
    phone: '+34 976 123 456',
    dpo: 'dpo@ebrovalley.digital',
    website: 'https://ebrovalley.digital'
  },

  // Data Retention Periods (in days, 0 = unlimited)
  retention: {
    activeUser: 0, // While account is active
    inactiveUser: 1095, // 3 years
    financialRecords: 2555, // 7 years (legal requirement)
    analyticsData: 730, // 2 years
    technicalLogs: 180, // 6 months
    marketingConsent: 0, // Until withdrawn
    cookieConsent: 365, // 1 year
    gdprRequests: 2555 // 7 years (legal requirement)
  },

  // Cookie Categories Configuration
  cookieCategories: {
    necessary: {
      name: 'Cookies Esenciales',
      description: 'Necesarias para el funcionamiento básico del sitio web',
      canDisable: false,
      defaultEnabled: true
    },
    analytics: {
      name: 'Cookies de Análisis',
      description: 'Nos ayudan a entender cómo interactúan los visitantes',
      canDisable: true,
      defaultEnabled: false
    },
    marketing: {
      name: 'Cookies de Marketing',
      description: 'Para ofrecer contenido publicitario más relevante',
      canDisable: true,
      defaultEnabled: false
    },
    preferences: {
      name: 'Cookies de Preferencias',
      description: 'Recordar información que cambia el comportamiento del sitio',
      canDisable: true,
      defaultEnabled: false
    }
  },

  // GDPR Rights Response Times (in days)
  responseTimeframes: {
    access: 30, // Right to access
    rectification: 30, // Right to rectification
    erasure: 30, // Right to erasure
    restriction: 30, // Right to restriction
    portability: 30, // Right to data portability
    objection: 30, // Right to object
    automation: 30 // Rights related to automated decision-making
  },

  // Legal Bases for Processing
  legalBases: {
    contract: 'Ejecución de contrato - Art. 6(1)(b) RGPD',
    consent: 'Consentimiento - Art. 6(1)(a) RGPD',
    legitimateInterest: 'Interés legítimo - Art. 6(1)(f) RGPD',
    legalObligation: 'Obligación legal - Art. 6(1)(c) RGPD',
    vitalInterests: 'Intereses vitales - Art. 6(1)(d) RGPD',
    publicTask: 'Misión de interés público - Art. 6(1)(e) RGPD'
  },

  // Data Processing Purposes
  processingPurposes: {
    serviceProvision: {
      purpose: 'Prestación del servicio educativo',
      legalBasis: 'contract',
      dataTypes: ['personal', 'learning', 'progress'],
      retention: 'activeUser'
    },
    personalization: {
      purpose: 'Personalización del aprendizaje',
      legalBasis: 'legitimateInterest',
      dataTypes: ['learning', 'preferences', 'behavior'],
      retention: 'activeUser'
    },
    communication: {
      purpose: 'Comunicaciones del servicio',
      legalBasis: 'contract',
      dataTypes: ['contact', 'preferences'],
      retention: 'activeUser'
    },
    marketing: {
      purpose: 'Marketing y promociones',
      legalBasis: 'consent',
      dataTypes: ['contact', 'preferences', 'behavior'],
      retention: 'marketingConsent'
    },
    analytics: {
      purpose: 'Análisis y mejora del servicio',
      legalBasis: 'legitimateInterest',
      dataTypes: ['usage', 'technical', 'anonymized'],
      retention: 'analyticsData'
    },
    legal: {
      purpose: 'Cumplimiento legal y fiscal',
      legalBasis: 'legalObligation',
      dataTypes: ['financial', 'transaction', 'identity'],
      retention: 'financialRecords'
    }
  },

  // Third Party Data Processors
  dataProcessors: {
    stripe: {
      name: 'Stripe',
      purpose: 'Procesamiento de pagos',
      country: 'Estados Unidos',
      adequacy: 'Adequacy Decision',
      safeguards: 'Privacy Shield / Standard Contractual Clauses'
    },
    googleAnalytics: {
      name: 'Google Analytics',
      purpose: 'Análisis web',
      country: 'Estados Unidos',
      adequacy: 'Adequacy Decision',
      safeguards: 'Google Ads Data Processing Terms'
    },
    aws: {
      name: 'Amazon Web Services',
      purpose: 'Alojamiento en la nube',
      country: 'Unión Europea',
      adequacy: 'Adequate Country',
      safeguards: 'AWS Data Processing Addendum'
    }
  },

  // Security Measures
  securityMeasures: {
    technical: [
      'Cifrado de datos en tránsito (TLS/SSL)',
      'Cifrado de datos en reposo (AES-256)',
      'Autenticación multifactor disponible',
      'Firewalls y sistemas de detección de intrusos',
      'Copias de seguridad cifradas',
      'Pseudonimización de datos analíticos'
    ],
    organizational: [
      'Formación del personal en protección de datos',
      'Políticas de acceso basadas en roles',
      'Auditorías de seguridad regulares',
      'Procedimientos de respuesta a incidentes',
      'Acuerdos de confidencialidad',
      'Evaluación de impacto en protección de datos'
    ]
  },

  // Consent Management
  consentManagement: {
    version: '1.0',
    granular: true, // Allow granular consent per purpose
    withdrawal: true, // Allow easy withdrawal
    record: true, // Record consent decisions
    proof: true // Provide proof of consent
  }
};

export default GDPR_CONFIG;