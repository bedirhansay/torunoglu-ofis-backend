import { IQuery } from '@nestjs/cqrs';

export class ListCustomersQuery implements IQuery {
  constructor(
    public readonly companyId: string,
    public readonly pageNumber?: number,
    public readonly pageSize?: number,
    public readonly search?: string
  ) {}
}
