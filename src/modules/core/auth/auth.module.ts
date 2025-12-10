import { TransactionService } from '../../../common/services/transaction.service';
import { User, UserSchema } from '../../../modules/core/users/user.schema';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { LoginHandler } from './commands/handlers/login.handler';
import { RegisterHandler } from './commands/handlers/register.handler';
import { CustomJwtModule } from './jwt-strategy';

const CommandHandlers = [LoginHandler, RegisterHandler];

@Module({
  imports: [CqrsModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), CustomJwtModule],
  controllers: [AuthController],
  providers: [...CommandHandlers, TransactionService],
  exports: [CustomJwtModule],
})
export class AuthModule {}
