import { ConflictException, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CommandResponseDto } from '../../../../../common';
import { ensureValidObjectId } from '../../../../../common/helper/object.id';
import { Vehicle, VehicleDocument } from '../../vehicle.schema';
import { CreateVehicleCommand } from '../create-vehicle.command';

@Injectable()
@CommandHandler(CreateVehicleCommand)
export class CreateVehicleHandler implements ICommandHandler<CreateVehicleCommand> {
  constructor(
    @InjectModel(Vehicle.name)
    private readonly vehicleModel: Model<VehicleDocument>
  ) {}

  async execute(command: CreateVehicleCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.companyId, 'Geçersiz firma ID');
    ensureValidObjectId(command.createVehicleDto.driverId, 'Geçersiz sürücü ID');

    const existing = await this.vehicleModel
      .findOne({
        plateNumber: command.createVehicleDto.plateNumber,
        companyId: new Types.ObjectId(command.companyId),
      })
      .lean()
      .exec();

    if (existing) {
      throw new ConflictException('Bu plaka ile kayıtlı bir araç zaten mevcut');
    }

    const created = await new this.vehicleModel({
      ...command.createVehicleDto,
      companyId: new Types.ObjectId(command.companyId),
      driverId: new Types.ObjectId(command.createVehicleDto.driverId),
    }).save();

    return {
      statusCode: 201,
      id: created.id.toString(),
    };
  }
}
