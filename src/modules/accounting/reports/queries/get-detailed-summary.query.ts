import { DateRangeDTO } from '@common/dto/request';
import { IQuery } from '@nestjs/cqrs';

export class GetDetailedSummaryQuery implements IQuery {
  constructor(
    public readonly companyId: string,
    public readonly dateRange: DateRangeDTO
  ) {}
}
