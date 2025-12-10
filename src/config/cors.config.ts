import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

export function createCorsConfig(configService: ConfigService): CorsOptions {
  const allowedOrigins = configService.get<string[]>('cors.allowedOrigins') || [
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  const isDevelopment = configService.get<string>('nodeEnv') === 'development';

  return {
    // origin: (origin, callback) => {
    //   if (!origin || allowedOrigins.includes(origin)) {
    //     return callback(null, true);
    //   }

    //   if (!origin && isDevelopment) {
    //     return callback(null, true);
    //   }

    //   if (
    //     isDevelopment &&
    //     origin &&
    //     (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))
    //   ) {
    //     return callback(null, true);
    //   }

    //   callback(new Error('This origin is not allowed'));
    // },
    origin: ['*'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-company-id', 'x-correlation-id'],
    exposedHeaders: ['Authorization'],
    credentials: true,
    maxAge: 864000,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
}
