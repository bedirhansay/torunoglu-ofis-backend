import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { ensureValidObjectId } from '@common/helper/object.id';
import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateFuelCommand } from '../create-fuel.command';
import { Fuel, FuelDocument } from '../../fuel.schema';

@Injectable()
@CommandHandler(CreateFuelCommand)
export class CreateFuelHandler implements ICommandHandler<CreateFuelCommand> {
  constructor(
    @InjectModel(Fuel.name)
    private readonly fuelModel: Model<FuelDocument>
  ) {}

  async execute(command: CreateFuelCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.companyId, 'Geçersiz firma ID');

    const created = await new this.fuelModel({
      ...command.createFuelDto,
      companyId: new Types.ObjectId(command.companyId),
      vehicleId: new Types.ObjectId(command.createFuelDto.vehicleId),
    }).save();

    return {
      statusCode: 201,
      id: created.id.toString(),
    };
  }
}
