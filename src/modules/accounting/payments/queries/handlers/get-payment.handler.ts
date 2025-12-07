import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { ensureValidObjectId } from '@common/helper/object.id';
import { PaymentDto } from '../../dto/payment.dto';
import { Payment, PaymentDocument } from '../../payment.schema';
import { GetPaymentQuery } from '../get-payment.query';

@Injectable()
@QueryHandler(GetPaymentQuery)
export class GetPaymentHandler implements IQueryHandler<GetPaymentQuery> {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>
  ) {}

  async execute(query: GetPaymentQuery): Promise<PaymentDto> {
    ensureValidObjectId(query.id, 'Geçersiz ödeme ID');
    ensureValidObjectId(query.companyId, 'Geçersiz firma ID');

    const payment = await this.paymentModel
      .findOne({
        _id: new Types.ObjectId(query.id),
        companyId: new Types.ObjectId(query.companyId),
      })
      .populate('customerId', 'name')
      .lean()
      .exec();

    if (!payment) {
      throw new NotFoundException('Ödeme kaydı bulunamadı');
    }

    return plainToInstance(PaymentDto, payment, { excludeExtraneousValues: true });
  }
}

