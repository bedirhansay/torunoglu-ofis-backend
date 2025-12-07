import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CqrsModule } from '@nestjs/cqrs';
import { Company, CompanySchema } from '@core/companies/company.schema';
import { EmployeeController } from './employee.controller';
import { Employee, EmployeeSchema } from './employee.schema';
import { CreateEmployeeHandler } from './commands/handlers/create-employee.handler';
import { UpdateEmployeeHandler } from './commands/handlers/update-employee.handler';
import { DeleteEmployeeHandler } from './commands/handlers/delete-employee.handler';
import { GetEmployeeHandler } from './queries/handlers/get-employee.handler';
import { ListEmployeesHandler } from './queries/handlers/list-employees.handler';

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
  ],
  controllers: [EmployeeController],
  providers: [
    CreateEmployeeHandler,
    UpdateEmployeeHandler,
    DeleteEmployeeHandler,
    GetEmployeeHandler,
    ListEmployeesHandler,
  ],
})
export class EmployeeModule {}
