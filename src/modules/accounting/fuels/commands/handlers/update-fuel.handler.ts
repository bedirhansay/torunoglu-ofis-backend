import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { ensureValidObjectId } from '@common/helper/object.id';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Fuel, FuelDocument } from '../../fuel.schema';
import { UpdateFuelCommand } from '../update-fuel.command';

@Injectable()
@CommandHandler(UpdateFuelCommand)
export class UpdateFuelHandler implements ICommandHandler<UpdateFuelCommand> {
  constructor(
    @InjectModel(Fuel.name)
    private readonly fuelModel: Model<FuelDocument>
  ) {}

  async execute(command: UpdateFuelCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.id, 'Geçersiz yakıt ID');
    ensureValidObjectId(command.companyId, 'Geçersiz firma ID');

    const updated = await this.fuelModel.findOneAndUpdate(
      { _id: new Types.ObjectId(command.id), companyId: new Types.ObjectId(command.companyId) },
      {
        ...command.updateFuelDto,
        ...(command.updateFuelDto.vehicleId && { vehicleId: new Types.ObjectId(command.updateFuelDto.vehicleId) }),
      },
      { new: true }
    );

    if (!updated) {
      throw new NotFoundException('Güncellenecek yakıt kaydı bulunamadı');
    }

    return {
      statusCode: 200,
      id: updated.id.toString(),
    };
  }
}
