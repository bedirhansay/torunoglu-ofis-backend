import { IQuery } from '@nestjs/cqrs';

export class ListCategoriesQuery implements IQuery {
  constructor(
    public readonly companyId: string,
    public readonly pageNumber?: number,
    public readonly pageSize?: number,
    public readonly search?: string,
  ) {}
}

