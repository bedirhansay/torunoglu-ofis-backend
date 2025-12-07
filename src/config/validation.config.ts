import { ValidationPipeOptions } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export function createValidationConfig(configService: ConfigService): ValidationPipeOptions {
  return {
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    disableErrorMessages: configService.get<string>('nodeEnv') === 'production',
  };
}
