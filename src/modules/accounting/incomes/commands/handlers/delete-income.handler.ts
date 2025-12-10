import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { ensureValidObjectId } from '@common/helper/object.id';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DeleteIncomeCommand } from '../delete-income.command';
import { Income, IncomeDocument } from '../../income.schema';

@Injectable()
@CommandHandler(DeleteIncomeCommand)
export class DeleteIncomeHandler implements ICommandHandler<DeleteIncomeCommand> {
  constructor(
    @InjectModel(Income.name)
    private readonly incomeModel: Model<IncomeDocument>
  ) {}

  async execute(command: DeleteIncomeCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.id, 'Geçersiz gelir ID');

    const deleted = await this.incomeModel
      .findOneAndDelete({ _id: new Types.ObjectId(command.id), companyId: new Types.ObjectId(command.companyId) })
      .exec();

    if (!deleted) {
      throw new NotFoundException('Silinecek gelir kaydı bulunamadı');
    }

    return {
      statusCode: 204,
      id: deleted.id.toString(),
    };
  }
}
