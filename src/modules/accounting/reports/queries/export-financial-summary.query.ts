import { DateRangeDTO } from '../../../../common/dto/request';
import { IQuery } from '@nestjs/cqrs';

export class ExportFinancialSummaryQuery implements IQuery {
  constructor(
    public readonly companyId: string,
    public readonly dateRange: DateRangeDTO
  ) {}
}
