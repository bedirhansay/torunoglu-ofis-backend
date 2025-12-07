import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CqrsModule } from '@nestjs/cqrs';
import { Company, CompanySchema } from '@core/companies/company.schema';
import { VehicleController } from './vehicle.controller';
import { Vehicle, VehicleSchema } from './vehicle.schema';
import { CreateVehicleHandler } from './commands/handlers/create-vehicle.handler';
import { UpdateVehicleHandler } from './commands/handlers/update-vehicle.handler';
import { DeleteVehicleHandler } from './commands/handlers/delete-vehicle.handler';
import { GetVehicleHandler } from './queries/handlers/get-vehicle.handler';
import { ListVehiclesHandler } from './queries/handlers/list-vehicles.handler';

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([
      { name: Vehicle.name, schema: VehicleSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
  ],
  controllers: [VehicleController],
  providers: [
    CreateVehicleHandler,
    UpdateVehicleHandler,
    DeleteVehicleHandler,
    GetVehicleHandler,
    ListVehiclesHandler,
  ],
})
export class VehiclesModule {}
