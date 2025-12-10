// jwt.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'development-secret-change-in-production',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '365d' },
    }),
  ],
  exports: [JwtModule],
})
export class CustomJwtModule {}
