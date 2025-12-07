import { ICommand } from '@nestjs/cqrs';

export class UpdateCategoryCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly type?: 'income' | 'expense',
    public readonly isActive?: boolean,
  ) {}
}

