import { IQuery } from '@nestjs/cqrs';

export class GetEmployeeQuery implements IQuery {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
  ) {}
}

