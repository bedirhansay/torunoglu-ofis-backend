import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Model } from 'mongoose';
import { hashPassword } from '@common/utils/password.util';
import { RegisterCommand } from '../register.command';
import { User, UserDocument } from '@core/users/user.schema';

@Injectable()
@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async execute(command: RegisterCommand): Promise<{ message: string }> {
    const email = command.email.trim().toLowerCase();
    const username = command.username.trim().toLowerCase();

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Bu e-posta zaten kayıtlı');
    }

    try {
      const hashedPassword = await hashPassword(command.password);

      const newUser = new this.userModel({
        username,
        email,
        password: hashedPassword,
        role: 'user',
        isActive: true,
      });

      await newUser.save();

      return {
        message: 'Kayıt başarılı',
      };
    } catch (error) {
      throw new InternalServerErrorException('Kayıt sırasında bir hata oluştu');
    }
  }
}

