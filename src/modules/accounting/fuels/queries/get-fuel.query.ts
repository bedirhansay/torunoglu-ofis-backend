import { IQuery } from '@nestjs/cqrs';

export class GetFuelQuery implements IQuery {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
  ) {}
}

