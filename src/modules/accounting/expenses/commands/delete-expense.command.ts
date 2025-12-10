import { ICommand } from '@nestjs/cqrs';

export class DeleteExpenseCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
  ) {}
}

