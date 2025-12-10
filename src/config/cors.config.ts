import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export function createCorsConfig(): CorsOptions {
  return {
    origin: true, // Allow all origins
    credentials: true, // Allow credentials (cookies, authorization headers)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-company-id', 'x-correlation-id'],
    exposedHeaders: ['Authorization', 'x-correlation-id'],
    maxAge: 86400, // Cache preflight requests for 24 hours
  };
}
