import { ICommand } from '@nestjs/cqrs';
import { UpdateFuelDto } from '../dto/update-fuel.dto';

export class UpdateFuelCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly updateFuelDto: UpdateFuelDto,
    public readonly companyId: string,
  ) {}
}

