import { CommandResponseDto } from '../../../../../common';
import { ensureValidObjectId } from '../../../../../common/helper/object.id';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense, ExpenseDocument } from '../../expense.schema';
import { DeleteExpenseCommand } from '../delete-expense.command';

@Injectable()
@CommandHandler(DeleteExpenseCommand)
export class DeleteExpenseHandler implements ICommandHandler<DeleteExpenseCommand> {
  constructor(
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>
  ) {}

  async execute(command: DeleteExpenseCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.id, 'Geçersiz gider ID');

    const deleted = await this.expenseModel
      .findOneAndDelete({
        _id: new Types.ObjectId(command.id),
        companyId: new Types.ObjectId(command.companyId),
      })
      .exec();

    if (!deleted) {
      throw new NotFoundException('Silinecek gider bulunamadı');
    }

    return {
      statusCode: 204,
      id: deleted.id.toString(),
    };
  }
}
