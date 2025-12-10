import { CommandResponseDto } from '../../../../../common';
import { ensureValidObjectId } from '../../../../../common/helper/object.id';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer, CustomerDocument } from '../../customer.schema';
import { UpdateCustomerCommand } from '../update-customer.command';

@Injectable()
@CommandHandler(UpdateCustomerCommand)
export class UpdateCustomerHandler implements ICommandHandler<UpdateCustomerCommand> {
  private static readonly ERROR_MESSAGES = {
    INVALID_CUSTOMER_ID: 'Geçersiz müşteri ID',
    CUSTOMER_UPDATE_FAILED: 'Güncellenecek müşteri bulunamadı',
    CUSTOMER_ALREADY_EXISTS: 'Bu isimde bir müşteri zaten mevcut',
  };

  constructor(@InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>) {}

  async execute(command: UpdateCustomerCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.id, UpdateCustomerHandler.ERROR_MESSAGES.INVALID_CUSTOMER_ID);

    if (command.name) {
      const exists = await this.customerModel
        .findOne({
          name: command.name,
          companyId: new Types.ObjectId(command.companyId),
          _id: { $ne: new Types.ObjectId(command.id) },
        })
        .lean()
        .exec();

      if (exists) {
        throw new ConflictException(UpdateCustomerHandler.ERROR_MESSAGES.CUSTOMER_ALREADY_EXISTS);
      }
    }

    const updateData: any = {};
    if (command.name) updateData.name = command.name;
    if (command.description !== undefined) updateData.description = command.description;
    if (command.phone !== undefined) updateData.phone = command.phone;

    const updated = await this.customerModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(command.id), companyId: new Types.ObjectId(command.companyId) },
        updateData,
        { new: true }
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(UpdateCustomerHandler.ERROR_MESSAGES.CUSTOMER_UPDATE_FAILED);
    }

    return {
      statusCode: 200,
      id: updated.id.toString(),
    };
  }
}
