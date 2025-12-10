import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CorrelationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get correlation ID from header or generate new one
    const correlationId = request.headers['x-correlation-id'] || uuidv4();

    // Attach correlation ID to request and response
    request.correlationId = correlationId;
    response.setHeader('x-correlation-id', correlationId);

    return next.handle();
  }
}
