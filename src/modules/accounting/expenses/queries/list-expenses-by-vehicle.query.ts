import { PaginatedDateSearchDTO } from '@common/dto/request/pagination.request.dto';
import { IQuery } from '@nestjs/cqrs';

export class ListExpensesByVehicleQuery implements IQuery {
  constructor(
    public readonly vehicleId: string,
    public readonly companyId: string,
    public readonly query: PaginatedDateSearchDTO
  ) {}
}
