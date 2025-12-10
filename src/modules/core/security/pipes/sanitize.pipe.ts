import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value);
    }
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }
    return value;
  }

  private sanitizeObject(obj: any): any {
    const sanitized: any = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        
        if (typeof value === 'string') {
          sanitized[key] = this.sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    }
    
    return sanitized;
  }

  private sanitizeString(str: string): string {
    if (typeof str !== 'string') {
      return str;
    }

    // XSS koruması - HTML tag'lerini temizle
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}

