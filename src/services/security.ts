import { logError } from '@utils/logger';

interface SecurityOptions {
  csrfToken?: string;
  allowedOrigins?: string[];
  maxRequestSize?: number;
}

class SecurityService {
  private static instance: SecurityService;
  private csrfToken: string | null = null;
  private allowedOrigins: Set<string>;
  private maxRequestSize: number;

  private constructor(options: SecurityOptions = {}) {
    this.allowedOrigins = new Set(options.allowedOrigins || [window.location.origin]);
    this.maxRequestSize = options.maxRequestSize || 10 * 1024 * 1024; // 10MB default
    if (options.csrfToken) {
      this.csrfToken = options.csrfToken;
    }
  }

  static getInstance(options?: SecurityOptions): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService(options);
    }
    return SecurityService.instance;
  }

  // CSRF Protection
  setCsrfToken(token: string): void {
    this.csrfToken = token;
  }

  getRequestHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    return headers;
  }

  // Input Validation
  validateInput(input: string, options: { maxLength?: number; pattern?: RegExp } = {}): boolean {
    if (!input) return false;
    
    if (options.maxLength && input.length > options.maxLength) {
      return false;
    }

    if (options.pattern && !options.pattern.test(input)) {
      return false;
    }

    // Check for common XSS patterns
    const xssPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    if (xssPattern.test(input)) {
      return false;
    }

    return true;
  }

  // File Validation
  validateFile(file: File, allowedTypes: string[]): boolean {
    if (file.size > this.maxRequestSize) {
      logError('File size exceeds maximum allowed size', { size: file.size, max: this.maxRequestSize });
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      logError('File type not allowed', { type: file.type, allowed: allowedTypes });
      return false;
    }

    return true;
  }

  // Origin Validation
  validateOrigin(origin: string): boolean {
    return this.allowedOrigins.has(origin);
  }

  // Sanitize HTML content
  sanitizeHtml(html: string): string {
    // Basic HTML sanitization
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // URL Validation
  validateUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return this.allowedOrigins.has(parsedUrl.origin);
    } catch {
      return false;
    }
  }

  // Add allowed origin
  addAllowedOrigin(origin: string): void {
    this.allowedOrigins.add(origin);
  }

  // Remove allowed origin
  removeAllowedOrigin(origin: string): void {
    this.allowedOrigins.delete(origin);
  }
}

export const securityService = SecurityService.getInstance();
