import { PaginatedSearchDTO } from '../../../../common/dto/request/search.request.dto';
import { IQuery } from '@nestjs/cqrs';

export class ListVehiclesQuery implements IQuery {
  constructor(
    public readonly companyId: string,
    public readonly query: PaginatedSearchDTO
  ) {}
}
