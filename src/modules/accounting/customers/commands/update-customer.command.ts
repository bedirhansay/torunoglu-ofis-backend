import { ICommand } from '@nestjs/cqrs';

export class UpdateCustomerCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly phone?: string,
  ) {}
}

