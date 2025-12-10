import { IQuery } from '@nestjs/cqrs';
import { PaginatedDateSearchDTO } from '../../../../common/dto/request/pagination.request.dto';

export class ListIncomesByCustomerQuery implements IQuery {
  constructor(
    public readonly customerId: string,
    public readonly companyId: string,
    public readonly query: PaginatedDateSearchDTO
  ) {}
}
