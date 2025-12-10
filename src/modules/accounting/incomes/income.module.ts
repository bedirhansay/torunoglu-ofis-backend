import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CqrsModule } from '@nestjs/cqrs';
import { Company, CompanySchema } from '../../core/companies/company.schema';
import { Customer, CustomerSchema } from '../customers/customer.schema';
import { IncomeController } from './income.controller';
import { Income, IncomeSchema } from './income.schema';
import { CreateIncomeHandler } from './commands/handlers/create-income.handler';
import { UpdateIncomeHandler } from './commands/handlers/update-income.handler';
import { DeleteIncomeHandler } from './commands/handlers/delete-income.handler';
import { GetIncomeHandler } from './queries/handlers/get-income.handler';
import { ListIncomesHandler } from './queries/handlers/list-incomes.handler';
import { ListIncomesByCustomerHandler } from './queries/handlers/list-incomes-by-customer.handler';
import { ExportAllIncomesHandler } from './queries/handlers/export-all-incomes.handler';
import { ExportMonthlyIncomeSummaryHandler } from './queries/handlers/export-monthly-income-summary.handler';

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([
      { name: Income.name, schema: IncomeSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
  ],
  controllers: [IncomeController],
  providers: [
    CreateIncomeHandler,
    UpdateIncomeHandler,
    DeleteIncomeHandler,
    GetIncomeHandler,
    ListIncomesHandler,
    ListIncomesByCustomerHandler,
    ExportAllIncomesHandler,
    ExportMonthlyIncomeSummaryHandler,
  ],
})
export class IncomeModule {}
