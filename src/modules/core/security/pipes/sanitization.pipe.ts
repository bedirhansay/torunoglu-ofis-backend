import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class SanitizationPipe implements PipeTransform {
  transform(value: any): any {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (Array.isArray(value)) {
      return value.map((v) => this.transform(v));
    }

    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value);
    }

    return value;
  }

  private sanitizeString(input: string): string {
    // Remove potentially dangerous characters and patterns
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/data:text\/html/gi, '') // Remove data URLs
      .replace(/</g, '&lt;') // Escape HTML
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();

    return sanitized;
  }

  private sanitizeObject(obj: any): any {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key
      const cleanKey = this.sanitizeString(key);

      if (typeof value === 'string') {
        sanitized[cleanKey] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[cleanKey] = this.sanitizeObject(value);
      } else {
        sanitized[cleanKey] = value;
      }
    }

    return sanitized;
  }
}
