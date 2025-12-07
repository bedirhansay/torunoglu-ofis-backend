import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { ensureValidObjectId } from '@common/helper/object.id';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DeleteFuelCommand } from '../delete-fuel.command';
import { Fuel, FuelDocument } from '../../fuel.schema';

@Injectable()
@CommandHandler(DeleteFuelCommand)
export class DeleteFuelHandler implements ICommandHandler<DeleteFuelCommand> {
  constructor(
    @InjectModel(Fuel.name)
    private readonly fuelModel: Model<FuelDocument>
  ) {}

  async execute(command: DeleteFuelCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.id, 'Geçersiz yakıt ID');
    ensureValidObjectId(command.companyId, 'Geçersiz firma ID');

    const deleted = await this.fuelModel
      .findOneAndDelete({
        _id: new Types.ObjectId(command.id),
        companyId: new Types.ObjectId(command.companyId),
      })
      .exec();

    if (!deleted) {
      throw new NotFoundException('Silinecek yakıt kaydı bulunamadı');
    }

    return {
      statusCode: 204,
      id: deleted.id.toString(),
    };
  }
}
