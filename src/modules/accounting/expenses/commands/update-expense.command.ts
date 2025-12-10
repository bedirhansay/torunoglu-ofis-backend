import { ICommand } from '@nestjs/cqrs';
import { UpdateExpenseDto } from '../dto/update-expense.dto';

export class UpdateExpenseCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly updateExpenseDto: UpdateExpenseDto,
    public readonly companyId: string,
  ) {}
}
