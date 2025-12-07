import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CqrsModule } from '@nestjs/cqrs';
import { Company, CompanySchema } from './company.schema';
import { CompaniesController } from './companies.controller';
import { CreateCompanyHandler } from './commands/handlers/create-company.handler';
import { UpdateCompanyHandler } from './commands/handlers/update-company.handler';
import { DeleteCompanyHandler } from './commands/handlers/delete-company.handler';
import { GetCompanyHandler } from './queries/handlers/get-company.handler';
import { ListCompaniesHandler } from './queries/handlers/list-companies.handler';

const CommandHandlers = [CreateCompanyHandler, UpdateCompanyHandler, DeleteCompanyHandler];
const QueryHandlers = [GetCompanyHandler, ListCompaniesHandler];

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
  ],
  controllers: [CompaniesController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }])],
})
export class CompaniesModule {}
