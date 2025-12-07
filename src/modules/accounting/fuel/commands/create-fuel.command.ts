import { ICommand } from '@nestjs/cqrs';
import { CreateFuelDto } from '../dto/create-fuel.dto';

export class CreateFuelCommand implements ICommand {
  constructor(
    public readonly createFuelDto: CreateFuelDto,
    public readonly companyId: string,
  ) {}
}

