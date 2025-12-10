import { IQuery } from '@nestjs/cqrs';
import { PaginatedDateSearchDTO } from '../../../../common/types/request/pagination.request.dto';

export class ListFuelsQuery implements IQuery {
  constructor(
    public readonly companyId: string,
    public readonly query: PaginatedDateSearchDTO
  ) {}
}
