import { IQuery } from '@nestjs/cqrs';
import { PaginatedDateSearchDTO } from '../../../../common/dto/request/pagination.request.dto';

export class ListExpensesByVehicleQuery implements IQuery {
  constructor(
    public readonly vehicleId: string,
    public readonly companyId: string,
    public readonly query: PaginatedDateSearchDTO
  ) {}
}
