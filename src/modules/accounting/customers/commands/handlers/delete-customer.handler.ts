import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { ensureValidObjectId } from '@common/helper/object.id';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer, CustomerDocument } from '../../customer.schema';
import { DeleteCustomerCommand } from '../delete-customer.command';

@Injectable()
@CommandHandler(DeleteCustomerCommand)
export class DeleteCustomerHandler implements ICommandHandler<DeleteCustomerCommand> {
  private static readonly ERROR_MESSAGES = {
    INVALID_CUSTOMER_ID: 'Geçersiz müşteri ID',
    CUSTOMER_DELETE_FAILED: 'Silinecek müşteri bulunamadı',
  };

  constructor(@InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>) {}

  async execute(command: DeleteCustomerCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.id, DeleteCustomerHandler.ERROR_MESSAGES.INVALID_CUSTOMER_ID);

    const deleted = await this.customerModel
      .findOneAndDelete({ _id: new Types.ObjectId(command.id), companyId: new Types.ObjectId(command.companyId) })
      .exec();

    if (!deleted) {
      throw new NotFoundException(DeleteCustomerHandler.ERROR_MESSAGES.CUSTOMER_DELETE_FAILED);
    }

    return {
      statusCode: 204,
      id: deleted.id.toString(),
    };
  }
}
