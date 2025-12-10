import { IQuery } from '@nestjs/cqrs';
import { PaginatedDateSearchDTO } from '../../../../common/types/request/pagination.request.dto';

export class ListFuelsByVehicleQuery implements IQuery {
  constructor(
    public readonly vehicleId: string,
    public readonly companyId: string,
    public readonly query: PaginatedDateSearchDTO
  ) {}
}
