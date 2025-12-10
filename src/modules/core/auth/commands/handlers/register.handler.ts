import { TransactionService } from '../../../../../common/services/transaction.service';
import { hashPassword } from '../../../../../common/utils/password.util';
import { User, UserDocument } from '../../../users/user.schema';
import { ConflictException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RegisterCommand } from '../register.command';

@Injectable()
@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  private readonly logger = new Logger(RegisterHandler.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly transactionService: TransactionService
  ) {}

  async execute(command: RegisterCommand): Promise<{ message: string }> {
    const email = command.email.trim().toLowerCase();
    const username = command.username.trim().toLowerCase();

    // Transaction kullanarak race condition önle
    return this.transactionService.executeInTransaction(async (session) => {
      // Email ve username kontrolü - transaction içinde
      const existingUser = await this.userModel
        .findOne({
          $or: [{ email }, { username }],
        })
        .session(session)
        .lean();

      if (existingUser) {
        if (existingUser.email === email) {
          throw new ConflictException('Bu e-posta zaten kayıtlı');
        }
        if (existingUser.username === username) {
          throw new ConflictException('Bu kullanıcı adı zaten kayıtlı');
        }
      }

      try {
        const hashedPassword = await hashPassword(command.password);

        const [newUser] = await this.userModel.create(
          [
            {
              username,
              email,
              password: hashedPassword,
              role: 'user',
              isActive: true,
            },
          ],
          { session }
        );

        return {
          message: 'Kayıt başarılı',
        };
      } catch (error: any) {
        // MongoDB duplicate key error (code 11000) - unique index tarafından yakalanan
        if (error.code === 11000) {
          const field = Object.keys(error.keyPattern || {})[0];
          const fieldName = field === 'email' ? 'e-posta' : field === 'username' ? 'kullanıcı adı' : field;
          throw new ConflictException(`Bu ${fieldName} zaten kayıtlı`);
        }

        // Logger'a detaylı error log
        this.logger.error(`Register error: ${error.message}`, error.stack);

        throw new InternalServerErrorException('Kayıt sırasında bir hata oluştu');
      }
    });
  }
}
