import { Company, CompanySchema } from '../../core/companies/company.schema';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { Employee, EmployeeSchema } from '../employees/employee.schema';
import { Vehicle, VehicleSchema } from '../vehicles/vehicle.schema';
import { CreateExpenseHandler } from './commands/handlers/create-expense.handler';
import { DeleteExpenseHandler } from './commands/handlers/delete-expense.handler';
import { UpdateExpenseHandler } from './commands/handlers/update-expense.handler';
import { ExpenseController } from './expense.controller';
import { Expense, ExpenseSchema } from './expense.schema';
import { GetExpenseHandler } from './queries/handlers/get-expense.handler';
import { ListExpensesByEmployeeHandler } from './queries/handlers/list-expenses-by-employee.handler';
import { ListExpensesByVehicleHandler } from './queries/handlers/list-expenses-by-vehicle.handler';
import { ListExpensesHandler } from './queries/handlers/list-expenses.handler';
import { ExportExpensesHandler } from './queries/handlers/export-expenses.handler';

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([
      { name: Expense.name, schema: ExpenseSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Vehicle.name, schema: VehicleSchema },
      { name: Employee.name, schema: EmployeeSchema },
    ]),
  ],
  controllers: [ExpenseController],
  providers: [
    CreateExpenseHandler,
    UpdateExpenseHandler,
    DeleteExpenseHandler,
    GetExpenseHandler,
    ListExpensesHandler,
    ListExpensesByVehicleHandler,
    ListExpensesByEmployeeHandler,
    ExportExpensesHandler,
  ],
})
export class ExpenseModule {}
