import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

export function createCorsConfig(configService: ConfigService): CorsOptions {
  const allowedOrigins = configService.get<string[]>('cors.allowedOrigins') || ['http://localhost:3000'];
  const isDevelopment = configService.get<string>('nodeEnv') === 'development';

  return {
    origin: (origin, callback) => {
      // Development'ta origin yoksa izin ver (Postman, curl gibi)
      if (!origin && isDevelopment) {
        return callback(null, true);
      }
      // Whitelist kontrolü
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy violation: Origin not allowed'));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-company-id'],
    exposedHeaders: ['Authorization'],
    credentials: true,
    maxAge: 86400, // 24 saat
  };
}
