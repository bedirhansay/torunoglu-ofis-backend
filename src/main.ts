import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';
import { createCorsConfig } from './config/cors.config';
import { createHelmetConfig } from './config/helmet.config';
import { createSwaggerConfig, swaggerDocumentOptions } from './config/swagger.config';
import { createValidationConfig } from './config/validation.config';

const expressApp = express();
let cachedApp: NestExpressApplication | null = null;

async function createNestApp(): Promise<NestExpressApplication> {
  if (cachedApp) {
    return cachedApp;
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(expressApp));
  const configService = app.get(ConfigService);

  app.enableCors(createCorsConfig(configService));

  app.use(createHelmetConfig());

  app.useGlobalPipes(new ValidationPipe(createValidationConfig(configService)));

  app.useStaticAssets(join(process.cwd(), appConfig.staticAssetsPath));

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

  await app.init();
  cachedApp = app;
  return cachedApp;
}

// Local development: traditional server startup
if (!process.env.VERCEL) {
  async function bootstrap() {
    const app = await createNestApp();
    const configService = app.get(ConfigService);
    const port = configService.get<number>('app.port') || appConfig.port;
    await app.listen(port);
  }
  bootstrap();
}

// Vercel serverless handler
export default async function handler(req: express.Request, res: express.Response) {
  const app = await createNestApp();
  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance(req, res);
}
