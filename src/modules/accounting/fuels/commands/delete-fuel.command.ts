import { ICommand } from '@nestjs/cqrs';

export class DeleteFuelCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
  ) {}
}

