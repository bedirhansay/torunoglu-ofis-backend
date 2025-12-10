import { IQuery } from '@nestjs/cqrs';
import { PaginatedSearchDTO } from '../../../../common/dto/request/search.request.dto';

export class ListEmployeesQuery implements IQuery {
  constructor(
    public readonly companyId: string,
    public readonly query: PaginatedSearchDTO
  ) {}
}
