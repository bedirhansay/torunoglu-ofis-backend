import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CqrsModule } from '@nestjs/cqrs';
import { Company, CompanySchema } from '@core/companies/company.schema';
import { FuelController } from './fuel.controller';
import { Fuel, FuelSchema } from './fuel.schema';
import { CreateFuelHandler } from './commands/handlers/create-fuel.handler';
import { UpdateFuelHandler } from './commands/handlers/update-fuel.handler';
import { DeleteFuelHandler } from './commands/handlers/delete-fuel.handler';
import { GetFuelHandler } from './queries/handlers/get-fuel.handler';
import { ListFuelsHandler } from './queries/handlers/list-fuels.handler';
import { ListFuelsByVehicleHandler } from './queries/handlers/list-fuels-by-vehicle.handler';
import { ExportFuelsHandler } from './queries/handlers/export-fuels.handler';
import { ExportMonthlyFuelSummaryHandler } from './queries/handlers/export-monthly-fuel-summary.handler';

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([
      { name: Fuel.name, schema: FuelSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
  ],
  controllers: [FuelController],
  providers: [
    CreateFuelHandler,
    UpdateFuelHandler,
    DeleteFuelHandler,
    GetFuelHandler,
    ListFuelsHandler,
    ListFuelsByVehicleHandler,
    ExportFuelsHandler,
    ExportMonthlyFuelSummaryHandler,
  ],
})
export class FuelModule {}
