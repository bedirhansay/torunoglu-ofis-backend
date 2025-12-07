import { IQuery } from '@nestjs/cqrs';

export class GetMonthlySummaryQuery implements IQuery {
  constructor(
    public readonly companyId: string,
    public readonly year?: number,
  ) {}
}

