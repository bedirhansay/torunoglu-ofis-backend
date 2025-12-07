import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CqrsModule } from '@nestjs/cqrs';
import { CustomJwtModule } from './jwt-strategy';
import { User, UserSchema } from '@core/users/user.schema';
import { AuthController } from './auth.controller';
import { LoginHandler } from './commands/handlers/login.handler';
import { RegisterHandler } from './commands/handlers/register.handler';

const CommandHandlers = [LoginHandler, RegisterHandler];

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    CustomJwtModule,
  ],
  controllers: [AuthController],
  providers: [...CommandHandlers],
  exports: [CustomJwtModule],
})
export class AuthModule {}
