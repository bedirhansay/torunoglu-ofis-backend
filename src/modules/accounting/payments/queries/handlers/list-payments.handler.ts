import { PaginatedResponseDto } from '@common/dto/response/paginated.response.dto';
import { ensureValidObjectId } from '@common/helper/object.id';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { PaymentDto } from '../../dto/payment.dto';
import { ListPaymentsQuery } from '../list-payments.query';
import { Payment, PaymentDocument } from '../../payment.schema';

@Injectable()
@QueryHandler(ListPaymentsQuery)
export class ListPaymentsHandler implements IQueryHandler<ListPaymentsQuery> {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>
  ) {}

  async execute(query: ListPaymentsQuery): Promise<PaginatedResponseDto<PaymentDto>> {
    ensureValidObjectId(query.companyId, 'Geçersiz firma ID');

    const { pageNumber, pageSize, search, beginDate, endDate } = query.query;

    const filter: any = { companyId: new Types.ObjectId(query.companyId) };

    if (search) {
      filter.$or = [{ description: { $regex: search, $options: 'i' } }];
    }

    if (beginDate || endDate) {
      filter.operationDate = {};
      if (beginDate) filter.operationDate.$gte = new Date(beginDate);
      if (endDate) filter.operationDate.$lte = new Date(endDate);
    }

    const [totalCount, payments] = await Promise.all([
      this.paymentModel.countDocuments(filter),
      this.paymentModel
        .find(filter)
        .select('_id customerId amount operationDate description companyId createdAt updatedAt')
        .populate('customerId', '_id name')
        .sort({ operationDate: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec(),
    ]);

    const items = plainToInstance(PaymentDto, payments, { excludeExtraneousValues: true });

    return {
      items,
      pageNumber,
      totalPages: Math.ceil(totalCount / pageSize),
      totalCount,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber * pageSize < totalCount,
    };
  }
}
