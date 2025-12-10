import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

export function createCorsConfig(configService: ConfigService): CorsOptions {
  const originsEnv = configService.get<string>('ALLOWED_ORIGINS') ?? '';
  const allowedOrigins = originsEnv.split(',').map((o) => o.trim());

  return {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-company-id', 'x-correlation-id'],
    exposedHeaders: ['Authorization', 'x-correlation-id'],
  };
}
