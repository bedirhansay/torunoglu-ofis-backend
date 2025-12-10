import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { ensureValidObjectId } from '@common/helper/object.id';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from '../../payment.schema';
import { UpdatePaymentCommand } from '../update-payment.command';

@Injectable()
@CommandHandler(UpdatePaymentCommand)
export class UpdatePaymentHandler implements ICommandHandler<UpdatePaymentCommand> {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>
  ) {}

  async execute(command: UpdatePaymentCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.id, 'Geçersiz ödeme ID');
    ensureValidObjectId(command.companyId, 'Geçersiz firma ID');

    if (command.updatePaymentDto.customerId) {
      ensureValidObjectId(command.updatePaymentDto.customerId, 'Geçersiz müşteri ID');
    }

    const updated = await this.paymentModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(command.id), companyId: new Types.ObjectId(command.companyId) },
        {
          ...command.updatePaymentDto,
          customerId: command.updatePaymentDto.customerId
            ? new Types.ObjectId(command.updatePaymentDto.customerId)
            : undefined,
        },
        { new: true }
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Güncellenecek ödeme kaydı bulunamadı');
    }

    return {
      statusCode: 200,
      id: updated.id.toString(),
    };
  }
}
