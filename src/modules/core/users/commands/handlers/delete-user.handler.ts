import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../user.schema';
import { DeleteUserCommand } from '../delete-user.command';

@Injectable()
@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async execute(command: DeleteUserCommand): Promise<CommandResponseDto> {
    if (!Types.ObjectId.isValid(command.id)) {
      throw new BadRequestException('Geçersiz kullanıcı ID');
    }

    const deletedUser = await this.userModel.findByIdAndDelete(command.id).exec();

    if (!deletedUser) {
      throw new NotFoundException('Silinecek kullanıcı bulunamadı');
    }

    return {
      statusCode: 200,
      id: deletedUser.id.toString(),
    };
  }
}
