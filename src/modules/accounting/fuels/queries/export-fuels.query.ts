import { IQuery } from '@nestjs/cqrs';
import { PaginatedDateSearchDTO } from '../../../../common/dto/request/pagination.request.dto';

export class ExportFuelsQuery implements IQuery {
  constructor(
    public readonly companyId: string,
    public readonly query: PaginatedDateSearchDTO
  ) {}
}
