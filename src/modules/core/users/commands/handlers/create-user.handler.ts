import { CommandResponseDto } from '../../../../../common';
import { hashPassword } from '../../../../../common/utils/password.util';
import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user.schema';
import { CreateUserCommand } from '../create-user.command';

@Injectable()
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async execute(command: CreateUserCommand): Promise<CommandResponseDto> {
    const hashedPassword = await hashPassword(command.password);

    const createdUser = new this.userModel({
      username: command.username,
      email: command.email,
      password: hashedPassword,
      role: command.role || 'user',
      isActive: command.isActive !== undefined ? command.isActive : true,
    });

    const savedUser = await createdUser.save();

    return {
      statusCode: 201,
      id: savedUser.id.toString(),
    };
  }
}
