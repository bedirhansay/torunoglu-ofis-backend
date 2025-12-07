import { IQuery } from '@nestjs/cqrs';

export class GetVehicleMonthlyFuelReportQuery implements IQuery {
  constructor(
    public readonly companyId: string,
    public readonly year: number,
    public readonly month: number // 1-12 arası
  ) {}
}
