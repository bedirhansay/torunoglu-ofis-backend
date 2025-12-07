import { IQuery } from '@nestjs/cqrs';

export class GetIncomeQuery implements IQuery {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
  ) {}
}

