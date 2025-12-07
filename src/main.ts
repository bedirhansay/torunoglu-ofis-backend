import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { getFinalDateRange } from './common/helper/get-date-params';
import { GlobalExceptionFilter } from './common/interceptor/global.exception';
import { ErrorLoggerService } from './modules/core/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Security Headers - Helmet
  app.use(helmet.default({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS Configuration - Environment-based
  const allowedOrigins = configService.get<string[]>('cors.allowedOrigins') || ['http://localhost:3000'];
  const isDevelopment = configService.get<string>('nodeEnv') === 'development';

  app.enableCors({
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
  });

  // Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: configService.get<string>('nodeEnv') === 'production',
    })
  );
  app.useStaticAssets(join(__dirname, '..', 'public'));

  app.setGlobalPrefix('api', {
    exclude: ['/', '/api-json', '/swagger', '/redoc', '/health'],
  });

  const config = new DocumentBuilder()
    .setTitle('API Dokümantasyonu')
    .setDescription('Muhasebe API dokümantasyonu')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        name: 'Authorization',
      },
      'Bearer'
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-company-id',
        in: 'header',
      },
      'x-company-id'
    )
    .addServer(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const errorLogger = app.get(ErrorLoggerService);
  app.useGlobalFilters(new GlobalExceptionFilter(errorLogger));
  const paginated = getFinalDateRange();

  app
    .getHttpAdapter()
    .getInstance()
    .get('/api-json', (req, res) => {
      res.json(document);
    });

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
