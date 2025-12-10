import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { ensureValidObjectId } from '@common/helper/object.id';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DeleteVehicleCommand } from '../delete-vehicle.command';
import { Vehicle, VehicleDocument } from '../../vehicle.schema';

@Injectable()
@CommandHandler(DeleteVehicleCommand)
export class DeleteVehicleHandler implements ICommandHandler<DeleteVehicleCommand> {
  constructor(
    @InjectModel(Vehicle.name)
    private readonly vehicleModel: Model<VehicleDocument>
  ) {}

  async execute(command: DeleteVehicleCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.id, 'Geçersiz araç ID');
    ensureValidObjectId(command.companyId, 'Geçersiz firma ID');

    const deleted = await this.vehicleModel
      .findOneAndDelete({
        _id: new Types.ObjectId(command.id),
        companyId: new Types.ObjectId(command.companyId),
      })
      .exec();

    if (!deleted) {
      throw new NotFoundException('Silinecek araç bulunamadı');
    }

    return {
      statusCode: 204,
      id: deleted.id.toString(),
    };
  }
}
