import { IQuery } from '@nestjs/cqrs';
import { DateRangeDTO } from '../../../../common/dto/request';

export class GetDetailedSummaryQuery implements IQuery {
  constructor(
    public readonly companyId: string,
    public readonly dateRange: DateRangeDTO
  ) {}
}
