import { IQuery } from '@nestjs/cqrs';
import { PaginatedDateSearchDTO } from '../../../../common/dto/request/pagination.request.dto';

export class ListExpensesByEmployeeQuery implements IQuery {
  constructor(
    public readonly employeeId: string,
    public readonly companyId: string,
    public readonly query: PaginatedDateSearchDTO
  ) {}
}
