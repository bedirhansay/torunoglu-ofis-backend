import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ErrorLoggerService } from '../../modules/core/logger/logger.service';
import { maskSensitiveData } from '../utils/log-utils';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: PinoLogger,
    private readonly errorLogger: ErrorLoggerService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user, companyId } = request;
    const userId = (user as any)?.id?.toString() || 'anonymous';
    const timestamp = new Date().toISOString();

    // Audit log için bilgileri topla
    const auditData = {
      method,
      url,
      userId,
      companyId: companyId || null,
      timestamp,
      ip: request.ip,
      userAgent: request.get('user-agent'),
    };

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;

          if (['POST', 'PATCH', 'DELETE'].includes(method)) {
            this.logger.info(
              {
                ...auditData,
                action: 'SUCCESS',
                statusCode,
                correlationId: request.correlationId,
                body: body ? maskSensitiveData(body) : undefined,
              },
              `Audit: ${method} ${url} - User: ${userId} - Company: ${companyId || 'N/A'}`
            );
          }
        },
        error: (error) => {
          const statusCode = error.status || 500;

          this.logger.error(
            {
              ...auditData,
              action: 'ERROR',
              error: error.message,
              statusCode,
              correlationId: request.correlationId,
              stack: error.stack,
              body: body ? maskSensitiveData(body) : undefined,
            },
            `Audit Error: ${method} ${url} - ${error.message}`
          );

          if (statusCode >= 500) {
            this.errorLogger.logError({
              message: `Audit Error: ${method} ${url}`,
              stack: error.stack,
              context: 'AuditInterceptor',
              path: url,
              method,
              companyId: companyId || undefined,
            });
          }
        },
      })
    );
  }
}
