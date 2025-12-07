import { ICommand } from '@nestjs/cqrs';

export class CreateCustomerCommand implements ICommand {
  constructor(
    public readonly name: string,
    public readonly companyId: string,
    public readonly description?: string,
    public readonly phone?: string,
  ) {}
}

