import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';
import { createCorsConfig } from './config/cors.config';
import { createHelmetConfig } from './config/helmet.config';
import { createSwaggerConfig, swaggerDocumentOptions } from './config/swagger.config';
import { createValidationConfig } from './config/validation.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.use(createHelmetConfig());

  app.enableCors(createCorsConfig(configService));

  app.useGlobalPipes(new ValidationPipe(createValidationConfig(configService)));

  app.useStaticAssets(join(__dirname, '..', appConfig.staticAssetsPath));

  app.setGlobalPrefix(appConfig.globalPrefix, {
    exclude: appConfig.globalPrefixExcludes,
  });

  const swaggerConfig = createSwaggerConfig(configService);
  const document = SwaggerModule.createDocument(app, swaggerConfig, swaggerDocumentOptions);
  SwaggerModule.setup('swagger', app, document);

  app
    .getHttpAdapter()
    .getInstance()
    .get('/api-json', (req, res) => {
      res.json(document);
    });

  const port = configService.get<number>('app.port') || appConfig.port;
  await app.listen(port);
}

bootstrap();
