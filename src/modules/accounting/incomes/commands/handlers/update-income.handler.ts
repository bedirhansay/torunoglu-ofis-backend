import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { ensureValidObjectId } from '@common/helper/object.id';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Income, IncomeDocument } from '../../income.schema';
import { UpdateIncomeCommand } from '../update-income.command';

@Injectable()
@CommandHandler(UpdateIncomeCommand)
export class UpdateIncomeHandler implements ICommandHandler<UpdateIncomeCommand> {
  constructor(
    @InjectModel(Income.name)
    private readonly incomeModel: Model<IncomeDocument>
  ) {}

  async execute(command: UpdateIncomeCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.id, 'Geçersiz gelir ID');

    const updated = await this.incomeModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(command.id),
          companyId: new Types.ObjectId(command.companyId),
        },
        {
          ...command.updateIncomeDto,
          ...(command.updateIncomeDto.customerId && {
            customerId: new Types.ObjectId(command.updateIncomeDto.customerId),
          }),
          ...(command.updateIncomeDto.categoryId && {
            categoryId: new Types.ObjectId(command.updateIncomeDto.categoryId),
          }),
        },
        { new: true }
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Güncellenecek gelir kaydı bulunamadı');
    }

    return {
      statusCode: 200,
      id: updated.id.toString(),
    };
  }
}
