import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerDocumentOptions } from '@nestjs/swagger';

export function createSwaggerConfig(configService: ConfigService) {
  return new DocumentBuilder()
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
    .addServer(
      configService.get<string>('app.baseUrl') || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'
    )
    .build();
}

export const swaggerDocumentOptions: SwaggerDocumentOptions = {
  operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
};
