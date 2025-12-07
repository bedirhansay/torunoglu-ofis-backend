import { ICommand } from '@nestjs/cqrs';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';

export class CreateVehicleCommand implements ICommand {
  constructor(
    public readonly createVehicleDto: CreateVehicleDto,
    public readonly companyId: string,
  ) {}
}

