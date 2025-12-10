import { ValidationPipeOptions } from '@nestjs/common';

export function createValidationConfig(): ValidationPipeOptions {
  return {
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    disableErrorMessages: process.env.NODE_ENV === 'production',
  };
}
