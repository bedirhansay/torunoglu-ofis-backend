import { IQuery } from '@nestjs/cqrs';

export class GetCompanyQuery implements IQuery {
  constructor(public readonly id: string) {}
}

