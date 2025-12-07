import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ErrorLoggerService } from '@core/logger/logger.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');

  constructor(private readonly errorLogger: ErrorLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user, companyId } = request;
    const userId = user?.id || 'anonymous';
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
          // Başarılı işlemler için audit log
          this.logger.debug(`Audit: ${method} ${url} - User: ${userId} - Company: ${companyId || 'N/A'}`);
          
          // Önemli işlemler için detaylı log (POST, PATCH, DELETE)
          if (['POST', 'PATCH', 'DELETE'].includes(method)) {
            this.logger.log(
              JSON.stringify({
                ...auditData,
                action: 'SUCCESS',
                statusCode: context.switchToHttp().getResponse().statusCode,
              })
            );
          }
        },
        error: (error) => {
          // Hatalı işlemler için audit log
          this.logger.error(
            JSON.stringify({
              ...auditData,
              action: 'ERROR',
              error: error.message,
              statusCode: error.status || 500,
            })
          );

          // Kritik hataları error logger'a da kaydet
          if (error.status >= 500) {
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

