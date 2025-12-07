import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { ensureValidObjectId } from '@common/helper/object.id';
import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense, ExpenseDocument } from '../../expense.schema';
import { CreateExpenseCommand } from '../create-expense.command';

@Injectable()
@CommandHandler(CreateExpenseCommand)
export class CreateExpenseHandler implements ICommandHandler<CreateExpenseCommand> {
  constructor(
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>
  ) {}

  async execute(command: CreateExpenseCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.companyId, 'Geçersiz firma ID');

    const created = await new this.expenseModel({
      ...command.createExpenseDto,
      companyId: new Types.ObjectId(command.companyId),
    }).save();

    return {
      statusCode: 201,
      id: created.id.toString(),
    };
  }
}
