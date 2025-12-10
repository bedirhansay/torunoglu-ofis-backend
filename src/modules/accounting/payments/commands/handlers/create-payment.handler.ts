import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CommandResponseDto } from '../../../../../common';
import { ensureValidObjectId } from '../../../../../common/helper/object.id';
import { Payment, PaymentDocument } from '../../payment.schema';
import { CreatePaymentCommand } from '../create-payment.command';

@Injectable()
@CommandHandler(CreatePaymentCommand)
export class CreatePaymentHandler implements ICommandHandler<CreatePaymentCommand> {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>
  ) {}

  async execute(command: CreatePaymentCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.companyId, 'Geçersiz firma ID');
    if (command.createPaymentDto.customerId) {
      ensureValidObjectId(command.createPaymentDto.customerId, 'Geçersiz müşteri ID');
    }

    const created = await new this.paymentModel({
      ...command.createPaymentDto,
      companyId: new Types.ObjectId(command.companyId),
      customerId: command.createPaymentDto.customerId
        ? new Types.ObjectId(command.createPaymentDto.customerId)
        : undefined,
    }).save();

    return {
      statusCode: 201,
      id: created.id.toString(),
    };
  }
}
