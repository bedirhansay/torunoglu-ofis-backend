import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

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
    // NoSQL Injection koruması - MongoDB operatörlerini temizle
    const mongoOperatorPatterns = [
      /\$where/gi,
      /\$regex/gi,
      /\$ne/gi,
      /\$gt/gi,
      /\$gte/gi,
      /\$lt/gi,
      /\$lte/gi,
      /\$in/gi,
      /\$nin/gi,
      /\$exists/gi,
      /\$type/gi,
      /\$mod/gi,
      /\$size/gi,
      /\$all/gi,
      /\$elemMatch/gi,
      /\$or/gi,
      /\$and/gi,
      /\$not/gi,
      /\$nor/gi,
      /\$text/gi,
      /\$search/gi,
      /\$language/gi,
      /\$caseSensitive/gi,
      /\$diacriticSensitive/gi,
    ];

    let sanitized = input;
    mongoOperatorPatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, '');
    });

    // XSS koruması - HTML ve script temizleme
    sanitized = sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/data:text\/html/gi, '') // Remove data URLs
      .replace(/</g, '&lt;') // Escape HTML
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/\0/g, '') // Remove null bytes
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim();

    return sanitized;
  }

  private sanitizeObject(obj: any): any {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // NoSQL Injection koruması - $ ile başlayan key'leri reddet
      if (key.startsWith('$')) {
        throw new BadRequestException(`Invalid field name: ${key}. Field names cannot start with '$'`);
      }

      // Sanitize key
      const cleanKey = this.sanitizeString(key);

      // Eğer key sanitize edildikten sonra $ ile başlıyorsa reddet
      if (cleanKey.startsWith('$')) {
        throw new BadRequestException(`Invalid field name: ${key}`);
      }

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
