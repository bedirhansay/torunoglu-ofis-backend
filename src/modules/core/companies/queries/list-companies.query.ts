import { IQuery } from '@nestjs/cqrs';

export class ListCompaniesQuery implements IQuery {
  constructor(
    public readonly pageNumber?: number,
    public readonly pageSize?: number,
    public readonly search?: string,
  ) {}
}

