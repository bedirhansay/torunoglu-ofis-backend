import { ICommand } from '@nestjs/cqrs';

export class DeleteEmployeeCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
  ) {}
}

