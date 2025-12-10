import { ErrorLoggerService } from '../../modules/core/logger/logger.service';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly isProduction: boolean;

  constructor(
    private readonly logger: PinoLogger,
    private readonly errorLogger: ErrorLoggerService,
    private readonly configService: ConfigService
  ) {
    this.isProduction = this.configService.get<string>('nodeEnv') === 'production';
  }

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const timestamp = new Date().toISOString();
    const path = req.url;
    const method = req.method;

    const message = this.getErrorMessage(exception);
    const error = (exception instanceof Error ? exception.name : (exception as any)?.name) ?? 'InternalServerError';
    const stack = (exception instanceof Error ? exception.stack : (exception as any)?.stack) ?? '';

    // Pino ile structured log (her zaman detaylı)
    this.logger.error(
      {
        statusCode: status,
        path,
        method,
        correlationId: (req as any)['correlationId'],
        companyId: (req as any)['companyId'],
        userId: ((req as any)['user'] as { id?: string })?.id?.toString() || 'anonymous',
        error,
        stack,
        message,
      },
      `Exception: ${method} ${path} - ${message}`
    );

    if (status >= 500) {
      await this.errorLogger.logError({
        message,
        stack,
        context: error,
        path,
        method,
        companyId: (req as any)['companyId'],
      });
    }

    const responseMessage =
      this.isProduction && status >= 500 ? 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.' : message;

    interface ErrorResponse {
      success: boolean;
      statusCode: number;
      message: string | string[];
      error: string;
      path: string;
      timestamp: string;
      errors?: Array<{ field: string; message: string; constraint?: string }>;
    }

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode: status,
      message: responseMessage,
      error,
      path,
      timestamp,
    };

    // Validation errors için standardize edilmiş format
    if (exception instanceof HttpException && status === 400) {
      const response = exception.getResponse();
      if (typeof response === 'object' && (response as any)?.message) {
        const validationMessage = (response as any).message;
        if (Array.isArray(validationMessage)) {
          errorResponse.message = 'Validation hatası';
          // Standardize edilmiş validation error formatı
          errorResponse.errors = this.formatValidationErrors(validationMessage);
        } else if (typeof validationMessage === 'string') {
          // Tek bir string mesaj ise, standardize format'a çevir
          errorResponse.errors = [{ field: 'general', message: validationMessage }];
        }
      }
    }

    res.status(status).json(errorResponse);
  }

  private getErrorMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return this.sanitizeErrorMessage(response);
      }

      if (typeof response === 'object') {
        const msg = (response as any)?.message;
        if (typeof msg === 'string') return this.sanitizeErrorMessage(msg);
        if (Array.isArray(msg)) return 'Validation hatası';
      }

      return this.sanitizeErrorMessage(exception.message);
    }

    if (exception instanceof Error) {
      return this.sanitizeErrorMessage(exception.message);
    }

    return 'Internal server error';
  }

  private formatValidationErrors(messages: string[]): Array<{ field: string; message: string; constraint?: string }> {
    return messages.map((msg) => {
      // "field must be constraint" formatından parse et
      const parts = msg.split(' must be ');
      if (parts.length > 1) {
        const field = parts[0].trim();
        const constraint = parts[1].trim();
        return { field, message: msg, constraint };
      }
      // Diğer formatlar için
      const match = msg.match(/^(.+?)\s+(.+)$/);
      if (match) {
        return { field: match[1], message: msg, constraint: match[2] };
      }
      return { field: 'unknown', message: msg };
    });
  }

  private sanitizeErrorMessage(message: string): string {
    if (!this.isProduction) {
      return message;
    }

    // Production'da sensitive bilgileri temizle
    // Database error mesajlarını generic mesajlara çevir
    if (message.includes('ECONNREFUSED') || message.includes('MongoError') || message.includes('MongooseError')) {
      return 'Veritabanı bağlantı hatası';
    }

    if (message.includes('duplicate key') || message.includes('E11000')) {
      return 'Bu kayıt zaten mevcut';
    }

    // Stack trace veya file path içeren mesajları temizle
    if (message.includes('at ') || message.includes('/node_modules/') || message.includes('\\node_modules\\')) {
      return 'Sunucu hatası oluştu';
    }

    return message;
  }
}
