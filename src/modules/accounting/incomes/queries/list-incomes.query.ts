import { IQuery } from '@nestjs/cqrs';
import { IncomeQueryDto } from '../dto/query-dto';

export class ListIncomesQuery implements IQuery {
  constructor(
    public readonly companyId: string,
    public readonly query: IncomeQueryDto,
  ) {}
}

