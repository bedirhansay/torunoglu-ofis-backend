import { IQuery } from '@nestjs/cqrs';
import { PaginatedDateSearchDTO } from '../../../../common/types/request/pagination.request.dto';

export class ListPaymentsByCustomerQuery implements IQuery {
  constructor(
    public readonly customerId: string,
    public readonly companyId: string,
    public readonly query: PaginatedDateSearchDTO
  ) {}
}
