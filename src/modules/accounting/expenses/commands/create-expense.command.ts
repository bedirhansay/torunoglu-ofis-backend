import { ICommand } from '@nestjs/cqrs';
import { CreateExpenseDto } from '../dto/create-expense.dto';

export class CreateExpenseCommand implements ICommand {
  constructor(
    public readonly createExpenseDto: CreateExpenseDto,
    public readonly companyId: string,
  ) {}
}
