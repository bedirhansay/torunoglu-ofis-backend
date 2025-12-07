import { IQuery } from '@nestjs/cqrs';

export class GetVehicleQuery implements IQuery {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
  ) {}
}

