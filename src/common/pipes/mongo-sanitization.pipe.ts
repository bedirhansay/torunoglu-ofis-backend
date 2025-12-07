import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class MongoSanitizationPipe implements PipeTransform {
  transform(value: any): any {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value);
    }

    return value;
  }

  private sanitizeString(input: string): string {
    const dangerousPatterns = [
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
    dangerousPatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    sanitized = sanitized
      .replace(/\0/g, '') 
      .replace(/[\x00-\x1F\x7F]/g, '') 
      .trim();

    return sanitized;
  }

  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.transform(item));
    }

    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const cleanKey = this.sanitizeString(key);

      if (cleanKey.startsWith('$')) {
        throw new BadRequestException(`Invalid field name: ${cleanKey}`);
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
