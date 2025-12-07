import { IQuery } from '@nestjs/cqrs';

export class GetCustomerIncomeSummaryQuery implements IQuery {
  constructor(
    public readonly customerId: string,
    public readonly companyId: string,
  ) {}
}

