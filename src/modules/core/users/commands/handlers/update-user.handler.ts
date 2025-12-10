import { CommandResponseDto } from '../../../../../common';
import { hashPassword } from '../../../../../common/utils/password.util';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../user.schema';
import { UpdateUserCommand } from '../update-user.command';

@Injectable()
@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async execute(command: UpdateUserCommand): Promise<CommandResponseDto> {
    if (!Types.ObjectId.isValid(command.id)) {
      throw new BadRequestException('Geçersiz kullanıcı ID');
    }

    const updateData: any = {};
    if (command.username) updateData.username = command.username;
    if (command.email) updateData.email = command.email;
    if (command.password) {
      updateData.password = await hashPassword(command.password);
    }
    if (command.role) updateData.role = command.role;
    if (command.isActive !== undefined) updateData.isActive = command.isActive;

    const updatedUser = await this.userModel.findByIdAndUpdate(command.id, updateData, { new: true }).exec();

    if (!updatedUser) {
      throw new NotFoundException('Güncellenecek kullanıcı bulunamadı');
    }

    return {
      statusCode: 200,
      id: updatedUser.id.toString(),
    };
  }
}
