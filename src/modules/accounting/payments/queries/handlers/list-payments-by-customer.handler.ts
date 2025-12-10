import { PaginatedResponseDto } from '../../../../../common/dto/response/paginated.response.dto';
import { FilterBuilder } from '../../../../../common/helper/filter.builder';
import { ensureValidObjectId } from '../../../../../common/helper/object.id';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { PaymentDto } from '../../dto/payment.dto';
import { ListPaymentsByCustomerQuery } from '../list-payments-by-customer.query';
import { Payment, PaymentDocument } from '../../payment.schema';

@Injectable()
@QueryHandler(ListPaymentsByCustomerQuery)
export class ListPaymentsByCustomerHandler implements IQueryHandler<ListPaymentsByCustomerQuery> {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>
  ) {}

  async execute(query: ListPaymentsByCustomerQuery): Promise<PaginatedResponseDto<PaymentDto>> {
    ensureValidObjectId(query.customerId, 'Geçersiz müşteri ID');
    ensureValidObjectId(query.companyId, 'Geçersiz firma ID');

    const { pageNumber, pageSize, search, beginDate, endDate } = query.query;

    const filter: any = {
      customerId: new Types.ObjectId(query.customerId),
      companyId: new Types.ObjectId(query.companyId),
    };

    if (search) {
      filter.description = { $regex: search, $options: 'i' };
    }

    // Add date range filter using FilterBuilder
    FilterBuilder.addDateRangeFilter(filter, beginDate, endDate);

    const totalCount = await this.paymentModel.countDocuments(filter);

    const data = await this.paymentModel
      .find(filter)
      .populate('customerId', 'name')
      .sort({ operationDate: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean()
      .exec();

    const items = plainToInstance(PaymentDto, data, { excludeExtraneousValues: true });

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
