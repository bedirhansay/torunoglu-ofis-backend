import { Company, CompanySchema } from '@core/companies/company.schema';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from '../customers/customer.schema';
import { Employee, EmployeeSchema } from '../employees/employee.schema';
import { Expense, ExpenseSchema } from '../expenses/expense.schema';
import { Fuel, FuelSchema } from '../fuels/fuel.schema';
import { Income, IncomeSchema } from '../incomes/income.schema';
import { Vehicle, VehicleSchema } from '../vehicles/vehicle.schema';
import { ExportFinancialSummaryHandler } from './queries/handlers/export-financial-summary.handler';
import { GetCustomerIncomeSummaryHandler } from './queries/handlers/get-customer-income-summary.handler';
import { GetDashboardStatsHandler } from './queries/handlers/get-dashboard-stats.handler';
import { GetDetailedSummaryHandler } from './queries/handlers/get-detailed-summary.handler';
import { GetMonthlySummaryHandler } from './queries/handlers/get-monthly-summary.handler';
import { GetVehicleMonthlyFuelReportHandler } from './queries/handlers/get-vehicle-monthly-fuel-report.handler';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([
      { name: Expense.name, schema: ExpenseSchema },
      { name: Income.name, schema: IncomeSchema },
      { name: Fuel.name, schema: FuelSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Vehicle.name, schema: VehicleSchema },
      { name: Employee.name, schema: EmployeeSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [
    GetDashboardStatsHandler,
    GetMonthlySummaryHandler,
    GetDetailedSummaryHandler,
    GetCustomerIncomeSummaryHandler,
    GetVehicleMonthlyFuelReportHandler,
    ExportFinancialSummaryHandler,
  ],
})
export class ReportsModule {}
