import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { ConflictException, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer, CustomerDocument } from '../../customer.schema';
import { CreateCustomerCommand } from '../create-customer.command';

@Injectable()
@CommandHandler(CreateCustomerCommand)
export class CreateCustomerHandler implements ICommandHandler<CreateCustomerCommand> {
  private static readonly ERROR_MESSAGES = {
    CUSTOMER_ALREADY_EXISTS: 'Bu isimde bir müşteri zaten mevcut',
  };

  constructor(@InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>) {}

  async execute(command: CreateCustomerCommand): Promise<CommandResponseDto> {
    const existing = await this.customerModel
      .findOne({
        companyId: new Types.ObjectId(command.companyId),
        name: command.name,
      })
      .lean()
      .exec();

    if (existing) {
      throw new ConflictException(CreateCustomerHandler.ERROR_MESSAGES.CUSTOMER_ALREADY_EXISTS);
    }

    const created = await new this.customerModel({
      name: command.name,
      description: command.description,
      phone: command.phone,
      companyId: new Types.ObjectId(command.companyId),
    }).save();

    return {
      statusCode: 201,
      id: created.id.toString(),
    };
  }
}
