import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

export function createCorsConfig(configService: ConfigService): CorsOptions {
  const allowedOrigins = configService.get<string[]>('cors.allowedOrigins') || [
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  const isDevelopment = configService.get<string>('nodeEnv') === 'development';

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Always allow localhost origins (for development and testing)
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }

      // Production: allow all origins (you can restrict this if needed)
      if (!isDevelopment) {
        return callback(null, true);
      }

      callback(new Error('CORS policy violation: Origin not allowed'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-company-id', 'x-correlation-id'],
    exposedHeaders: ['Authorization', 'x-correlation-id'],
    credentials: true,
    maxAge: 86400,
  };
}
