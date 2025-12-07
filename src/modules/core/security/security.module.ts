import { Module } from '@nestjs/common';
import {
  EnhancedValidationPipe,
  MongoSanitizationPipe,
  ParseObjectIdPipe,
  SanitizationPipe,
  SanitizePipe,
} from './pipes';

@Module({
  imports: [],
  providers: [SanitizePipe, MongoSanitizationPipe, ParseObjectIdPipe, EnhancedValidationPipe, SanitizationPipe],
  exports: [SanitizePipe, MongoSanitizationPipe, ParseObjectIdPipe, EnhancedValidationPipe, SanitizationPipe],
})
export class SecurityModule {}
