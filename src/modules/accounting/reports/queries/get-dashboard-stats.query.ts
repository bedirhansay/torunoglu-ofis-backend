import { IQuery } from '@nestjs/cqrs';

export class GetDashboardStatsQuery implements IQuery {
  constructor(
    public readonly companyId: string,
  ) {}
}

