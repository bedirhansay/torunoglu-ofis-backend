import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { ensureValidObjectId } from '@common/helper/object.id';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UpdateVehicleCommand } from '../update-vehicle.command';
import { Vehicle, VehicleDocument } from '../../vehicle.schema';

@Injectable()
@CommandHandler(UpdateVehicleCommand)
export class UpdateVehicleHandler implements ICommandHandler<UpdateVehicleCommand> {
  constructor(
    @InjectModel(Vehicle.name)
    private readonly vehicleModel: Model<VehicleDocument>
  ) {}

  async execute(command: UpdateVehicleCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.id, 'Geçersiz araç ID');
    ensureValidObjectId(command.companyId, 'Geçersiz firma ID');

    if (command.updateVehicleDto.driverId) {
      ensureValidObjectId(command.updateVehicleDto.driverId, 'Geçersiz sürücü ID');
    }

    if (command.updateVehicleDto.plateNumber) {
      const existing = await this.vehicleModel
        .findOne({
          companyId: new Types.ObjectId(command.companyId),
          plateNumber: command.updateVehicleDto.plateNumber,
          _id: { $ne: new Types.ObjectId(command.id) },
        })
        .lean()
        .exec();

      if (existing) {
        throw new ConflictException('Bu plaka ile kayıtlı bir araç zaten mevcut');
      }
    }

    const updateData: any = { ...command.updateVehicleDto };
    if (command.updateVehicleDto.driverId) {
      updateData.driverId = new Types.ObjectId(command.updateVehicleDto.driverId);
    }

    const updated = await this.vehicleModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(command.id), companyId: new Types.ObjectId(command.companyId) },
        updateData,
        { new: true }
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Güncellenecek araç bulunamadı');
    }

    return {
      statusCode: 200,
      id: updated.id.toString(),
    };
  }
}
