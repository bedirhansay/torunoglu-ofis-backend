import { IQuery } from '@nestjs/cqrs';

export class ExportAllIncomesQuery implements IQuery {
  constructor(
    public readonly companyId: string,
  ) {}
}

