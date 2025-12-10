import { ICommand } from '@nestjs/cqrs';

export class DeleteIncomeCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
  ) {}
}

