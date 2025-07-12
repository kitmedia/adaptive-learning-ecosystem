/**
 * Input Sanitization Utilities - Adaptive Learning Ecosystem
 * EbroValley Digital - XSS Prevention & Data Security
 */

import DOMPurify from 'dompurify';

/**
 * Sanitization configuration options
 */
export interface SanitizeOptions {
  allowTags?: string[];
  allowAttributes?: string[];
  allowedSchemes?: string[];
  maxLength?: number;
  stripTags?: boolean;
  allowDataAttributes?: boolean;
  allowLinks?: boolean;
}

/**
 * Default sanitization options for different contexts
 */
export const SANITIZE_PRESETS = {
  STRICT: {
    allowTags: [],
    allowAttributes: [],
    allowedSchemes: [],
    stripTags: true,
    allowDataAttributes: false,
    allowLinks: false
  } as SanitizeOptions,

  BASIC_TEXT: {
    allowTags: ['b', 'i', 'em', 'strong'],
    allowAttributes: [],
    allowedSchemes: [],
    stripTags: false,
    allowDataAttributes: false,
    allowLinks: false
  } as SanitizeOptions,

  RICH_TEXT: {
    allowTags: ['p', 'br', 'b', 'i', 'em', 'strong', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    allowAttributes: ['class'],
    allowedSchemes: [],
    stripTags: false,
    allowDataAttributes: false,
    allowLinks: false
  } as SanitizeOptions,

  EDUCATIONAL_CONTENT: {
    allowTags: ['p', 'br', 'b', 'i', 'em', 'strong', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'code', 'pre'],
    allowAttributes: ['href', 'src', 'alt', 'title', 'class', 'id'],
    allowedSchemes: ['http', 'https'],
    stripTags: false,
    allowDataAttributes: false,
    allowLinks: true
  } as SanitizeOptions
};

/**
 * Advanced input sanitization class
 */
export class InputSanitizer {
  private static instance: InputSanitizer;
  private purify: typeof DOMPurify;

  constructor() {
    this.purify = DOMPurify;
    this.configurePurify();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): InputSanitizer {
    if (!InputSanitizer.instance) {
      InputSanitizer.instance = new InputSanitizer();
    }
    return InputSanitizer.instance;
  }

  /**
   * Configure DOMPurify with security settings
   */
  private configurePurify(): void {
    // Add custom protocols that should be blocked
    this.purify.addHook('beforeSanitizeElements', (node) => {
      // Block dangerous protocols in links
      if (node instanceof Element && node.tagName === 'A') {
        const href = node.getAttribute('href');
        if (href && /^(javascript|data|vbscript):/i.test(href)) {
          node.removeAttribute('href');
        }
      }
    });

    // Remove dangerous attributes
    this.purify.addHook('beforeSanitizeAttributes', (node) => {
      // Remove event handlers
      for (const attr of node.attributes) {
        if (/^on/i.test(attr.name)) {
          node.removeAttribute(attr.name);
        }
      }
    });
  }

  /**
   * Sanitize HTML content
   */
  sanitizeHtml(input: string, options: SanitizeOptions = SANITIZE_PRESETS.STRICT): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Apply length limit
    if (options.maxLength && input.length > options.maxLength) {
      input = input.substring(0, options.maxLength);
    }

    // Configure DOMPurify options
    const config: any = {
      ALLOWED_TAGS: options.allowTags || [],
      ALLOWED_ATTR: options.allowAttributes || [],
      ALLOWED_URI_REGEXP: options.allowedSchemes?.length 
        ? new RegExp(`^(${options.allowedSchemes.join('|')}):`, 'i')
        : /^$/,
      ALLOW_DATA_ATTR: options.allowDataAttributes || false,
      FORBID_TAGS: options.stripTags ? ['script', 'object', 'embed', 'iframe', 'form'] : [],
      FORBID_ATTR: ['style', 'onerror', 'onload'],
      USE_PROFILES: { html: true }
    };

    // Strip all tags if requested
    if (options.stripTags) {
      config.ALLOWED_TAGS = [];
      config.KEEP_CONTENT = true;
    }

    return String(this.purify.sanitize(input, config));
  }

  /**
   * Sanitize plain text (removes all HTML)
   */
  sanitizeText(input: string, maxLength?: number): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove all HTML tags and decode entities
    let cleaned = this.purify.sanitize(input, { 
      ALLOWED_TAGS: [], 
      KEEP_CONTENT: true 
    });

    // Additional cleaning for special characters
    cleaned = cleaned
      .replace(/[<>]/g, '') // Remove any remaining brackets
      .replace(/&[#\w]+;/g, '') // Remove HTML entities
      .trim();

    // Apply length limit
    if (maxLength && cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength).trim();
    }

    return cleaned;
  }

  /**
   * Sanitize user input for different contexts
   */
  sanitizeUserInput(input: string, context: 'username' | 'email' | 'password' | 'search' | 'comment' | 'rich_text'): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    switch (context) {
      case 'username':
        return input
          .replace(/[^a-zA-Z0-9_-]/g, '')
          .substring(0, 50)
          .toLowerCase();

      case 'email':
        return input
          .replace(/[^a-zA-Z0-9@._-]/g, '')
          .substring(0, 254)
          .toLowerCase();

      case 'password':
        // Don't sanitize passwords, just limit length
        return input.substring(0, 128);

      case 'search':
        return this.sanitizeText(input, 100)
          .replace(/[<>'"]/g, '');

      case 'comment':
        return this.sanitizeHtml(input, SANITIZE_PRESETS.BASIC_TEXT);

      case 'rich_text':
        return this.sanitizeHtml(input, SANITIZE_PRESETS.EDUCATIONAL_CONTENT);

      default:
        return this.sanitizeText(input);
    }
  }

  /**
   * Sanitize URL for safe navigation
   */
  sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      return '';
    }

    try {
      const parsed = new URL(url, window.location.origin);
      
      // Only allow HTTP(S) protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return '';
      }

      return parsed.toString();
    } catch {
      // If URL parsing fails, treat as relative URL
      return url.replace(/[<>"']/g, '');
    }
  }

  /**
   * Sanitize file name
   */
  sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
      return 'untitled';
    }

    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }

  /**
   * Validate and sanitize form data
   */
  sanitizeFormData<T extends Record<string, any>>(
    data: T, 
    rules: Record<keyof T, { type: string; maxLength?: number; required?: boolean }>
  ): { sanitized: Partial<T>; errors: string[] } {
    const sanitized: Partial<T> = {};
    const errors: string[] = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      
      // Check required fields
      if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value === undefined || value === null) {
        continue;
      }

      // Sanitize based on type
      switch (rule.type) {
        case 'text':
          sanitized[field as keyof T] = this.sanitizeText(String(value), rule.maxLength) as any;
          break;
        
        case 'html':
          sanitized[field as keyof T] = this.sanitizeHtml(String(value), SANITIZE_PRESETS.BASIC_TEXT) as any;
          break;
        
        case 'rich_html':
          sanitized[field as keyof T] = this.sanitizeHtml(String(value), SANITIZE_PRESETS.EDUCATIONAL_CONTENT) as any;
          break;
        
        case 'email':
          sanitized[field as keyof T] = this.sanitizeUserInput(String(value), 'email') as any;
          break;
        
        case 'username':
          sanitized[field as keyof T] = this.sanitizeUserInput(String(value), 'username') as any;
          break;
        
        case 'url':
          sanitized[field as keyof T] = this.sanitizeUrl(String(value)) as any;
          break;
        
        case 'number':
          const num = Number(value);
          sanitized[field as keyof T] = (isNaN(num) ? 0 : num) as any;
          break;
        
        case 'boolean':
          sanitized[field as keyof T] = Boolean(value) as any;
          break;
        
        default:
          sanitized[field as keyof T] = this.sanitizeText(String(value)) as any;
      }
    }

    return { sanitized, errors };
  }
}

/**
 * Convenience functions for common sanitization tasks
 */
export const sanitizer = InputSanitizer.getInstance();

export const sanitizeHtml = (input: string, options?: SanitizeOptions) => 
  sanitizer.sanitizeHtml(input, options);

export const sanitizeText = (input: string, maxLength?: number) => 
  sanitizer.sanitizeText(input, maxLength);

export const sanitizeUserInput = (input: string, context: Parameters<typeof sanitizer.sanitizeUserInput>[1]) => 
  sanitizer.sanitizeUserInput(input, context);

export const sanitizeUrl = (url: string) => 
  sanitizer.sanitizeUrl(url);

export const sanitizeFileName = (fileName: string) => 
  sanitizer.sanitizeFileName(fileName);

export const sanitizeFormData = <T extends Record<string, any>>(
  data: T, 
  rules: Record<string, { type: string; maxLength?: number; required?: boolean; }>
) => sanitizer.sanitizeFormData(data, rules as any);

/**
 * React hook for input sanitization
 */
export const useSanitizer = () => {
  return {
    sanitizeHtml,
    sanitizeText,
    sanitizeUserInput,
    sanitizeUrl,
    sanitizeFileName,
    sanitizeFormData,
    PRESETS: SANITIZE_PRESETS
  };
};