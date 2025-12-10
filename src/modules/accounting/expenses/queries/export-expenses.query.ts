import { DateRangeDTO } from '@common/dto/request';
import { IQuery } from '@nestjs/cqrs';

export class ExportExpensesQuery implements IQuery {
  constructor(
    public readonly companyId: string,
    public readonly dateRange: DateRangeDTO
  ) {}
}
