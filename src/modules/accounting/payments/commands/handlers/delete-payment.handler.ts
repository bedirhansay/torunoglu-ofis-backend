import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
  import { CommandResponseDto } from '../../../../../common';
import { ensureValidObjectId } from '../../../../../common/helper/object.id';
import { Payment, PaymentDocument } from '../../payment.schema';
import { DeletePaymentCommand } from '../delete-payment.command';

@Injectable()
@CommandHandler(DeletePaymentCommand)
export class DeletePaymentHandler implements ICommandHandler<DeletePaymentCommand> {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>
  ) {}

  async execute(command: DeletePaymentCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.id, 'Geçersiz ödeme ID');
    ensureValidObjectId(command.companyId, 'Geçersiz firma ID');

    const deleted = await this.paymentModel
      .findOneAndDelete({
        _id: new Types.ObjectId(command.id),
        companyId: new Types.ObjectId(command.companyId),
      })
      .exec();

    if (!deleted) {
      throw new NotFoundException('Silinecek ödeme kaydı bulunamadı');
    }

    return {
      statusCode: 204,
      id: deleted.id.toString(),
    };
  }
}
