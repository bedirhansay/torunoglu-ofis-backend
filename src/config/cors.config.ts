import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export function createCorsConfig(): CorsOptions {
  return {
    origin: '*',
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-company-id', 'x-correlation-id'],
    exposedHeaders: ['x-correlation-id'],
  };
}
