import { ICommand } from '@nestjs/cqrs';
import { CreateEmployeeDto } from '../dto/create-employee.dto';

export class CreateEmployeeCommand implements ICommand {
  constructor(
    public readonly createEmployeeDto: CreateEmployeeDto,
    public readonly companyId: string,
  ) {}
}

