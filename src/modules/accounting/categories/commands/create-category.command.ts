import { ICommand } from '@nestjs/cqrs';

export class CreateCategoryCommand implements ICommand {
  constructor(
    public readonly name: string,
    public readonly type: 'income' | 'expense',
    public readonly isActive: boolean,
    public readonly companyId: string,
    public readonly description?: string,
  ) {}
}

