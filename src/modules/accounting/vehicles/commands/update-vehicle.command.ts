import { ICommand } from '@nestjs/cqrs';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';

export class UpdateVehicleCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly updateVehicleDto: UpdateVehicleDto,
    public readonly companyId: string,
  ) {}
}

