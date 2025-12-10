import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { ensureValidObjectId } from '@common/helper/object.id';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense, ExpenseDocument } from '../../expense.schema';
import { UpdateExpenseCommand } from '../update-expense.command';

@Injectable()
@CommandHandler(UpdateExpenseCommand)
export class UpdateExpenseHandler implements ICommandHandler<UpdateExpenseCommand> {
  constructor(
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>
  ) {}

  async execute(command: UpdateExpenseCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.id, 'Geçersiz gider ID');

    const updated = await this.expenseModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(command.id), companyId: new Types.ObjectId(command.companyId) },
        command.updateExpenseDto,
        { new: true }
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Gider güncellenemedi');
    }

    return {
      statusCode: 200,
      id: updated.id.toString(),
    };
  }
}
