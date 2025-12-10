import { IQuery } from '@nestjs/cqrs';
import { PaginatedDateSearchDTO } from '../../../../common/dto/request/pagination.request.dto';

export class ListExpensesQuery implements IQuery {
  constructor(
    public readonly companyId: string,
    public readonly query: PaginatedDateSearchDTO
  ) {}
}
