import { ICommand } from '@nestjs/cqrs';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';

export class UpdateEmployeeCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly updateEmployeeDto: UpdateEmployeeDto,
    public readonly companyId: string,
  ) {}
}

