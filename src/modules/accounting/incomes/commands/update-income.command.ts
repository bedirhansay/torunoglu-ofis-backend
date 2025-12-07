import { ICommand } from '@nestjs/cqrs';
import { UpdateIncomeDto } from '../dto/update-income.dto';

export class UpdateIncomeCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly updateIncomeDto: UpdateIncomeDto,
    public readonly companyId: string,
  ) {}
}

