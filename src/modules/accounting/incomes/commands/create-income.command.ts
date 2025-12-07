import { ICommand } from '@nestjs/cqrs';
import { CreateIncomeDto } from '../dto/create-income.dto';

export class CreateIncomeCommand implements ICommand {
  constructor(
    public readonly createIncomeDto: CreateIncomeDto,
    public readonly companyId: string,
  ) {}
}

