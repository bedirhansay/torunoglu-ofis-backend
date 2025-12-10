import { PaginatedDateSearchDTO } from '@common/dto/request/pagination.request.dto';
import { IQuery } from '@nestjs/cqrs';

export class ExportFuelsQuery implements IQuery {
  constructor(
    public readonly companyId: string,
    public readonly query: PaginatedDateSearchDTO
  ) {}
}
