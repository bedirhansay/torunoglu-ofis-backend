import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import {
  EnhancedValidationPipe,
  MongoSanitizationPipe,
  ParseObjectIdPipe,
  SanitizationPipe,
  SanitizePipe,
} from './pipes';

@Module({
  imports: [],
  providers: [
    SanitizePipe,
    MongoSanitizationPipe,
    ParseObjectIdPipe,
    EnhancedValidationPipe,
    SanitizationPipe,
    // Global pipe olarak SanitizationPipe'ı kullan (XSS ve NoSQL injection koruması)
    {
      provide: APP_PIPE,
      useClass: MongoSanitizationPipe,
    },
  ],
  exports: [SanitizePipe, MongoSanitizationPipe, ParseObjectIdPipe, EnhancedValidationPipe, SanitizationPipe],
})
export class SecurityModule {}
