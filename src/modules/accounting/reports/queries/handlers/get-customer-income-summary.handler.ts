import { Customer } from '@accounting/customers/customer.schema';
import { Income } from '@accounting/incomes/income.schema';
import { getMonthRange } from '@common/helper/date';
import { ensureValidObjectId } from '@common/helper/object.id';
import { Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomerIncomeSummaryDto } from '../../dto/customer-report.dto';
import { GetCustomerIncomeSummaryQuery } from '../get-customer-income-summary.query';

@Injectable()
@QueryHandler(GetCustomerIncomeSummaryQuery)
export class GetCustomerIncomeSummaryHandler implements IQueryHandler<GetCustomerIncomeSummaryQuery> {
  private static readonly ERROR_MESSAGES = {
    INVALID_CUSTOMER_ID: 'Geçersiz müşteri ID',
    INVALID_COMPANY_ID: 'Geçersiz şirket ID',
    CUSTOMER_NOT_FOUND: 'Müşteri bulunamadı',
  };

  constructor(
    @InjectModel(Income.name) private readonly incomeModel: Model<Income>,
    @InjectModel(Customer.name) private readonly customerModel: Model<Customer>
  ) {}

  async execute(query: GetCustomerIncomeSummaryQuery): Promise<CustomerIncomeSummaryDto> {
    ensureValidObjectId(query.customerId, GetCustomerIncomeSummaryHandler.ERROR_MESSAGES.INVALID_CUSTOMER_ID);
    ensureValidObjectId(query.companyId, GetCustomerIncomeSummaryHandler.ERROR_MESSAGES.INVALID_COMPANY_ID);

    const customerObjectId = new Types.ObjectId(query.customerId);
    const companyObjectId = new Types.ObjectId(query.companyId);

    const { beginDate, endDate } = getMonthRange();

    const [result, customer] = await Promise.all([
      this.incomeModel.aggregate([
        {
          $match: {
            customerId: customerObjectId,
            companyId: companyObjectId,
            operationDate: {
              $gte: beginDate,
              $lte: endDate,
            },
          },
        },
        {
          $addFields: {
            numericTotalAmount: { $toDouble: '$totalAmount' },
            numericUnitCount: { $toInt: '$unitCount' },
          },
        },
        {
          $group: {
            _id: '$customerId',
            totalInvoiced: { $sum: '$numericTotalAmount' },
            totalPaid: {
              $sum: {
                $cond: [{ $eq: ['$isPaid', true] }, '$numericTotalAmount', 0],
              },
            },
            totalCount: { $sum: '$numericUnitCount' },
            firstInvoice: { $min: '$operationDate' },
            lastInvoice: { $max: '$operationDate' },
          },
        },
        {
          $project: {
            customerId: '$_id',
            totalInvoiced: 1,
            totalPaid: 1,
            totalCount: 1,
            remainingReceivable: {
              $subtract: ['$totalInvoiced', '$totalPaid'],
            },
            paymentRate: {
              $cond: [
                { $gt: ['$totalInvoiced', 0] },
                { $multiply: [{ $divide: ['$totalPaid', '$totalInvoiced'] }, 100] },
                0,
              ],
            },
            firstInvoiceDate: '$firstInvoice',
            lastInvoiceDate: '$lastInvoice',
            _id: 0,
          },
        },
      ]),
      this.customerModel.findById(customerObjectId).lean().exec(),
    ]);

    if (!customer) {
      throw new NotFoundException(GetCustomerIncomeSummaryHandler.ERROR_MESSAGES.CUSTOMER_NOT_FOUND);
    }

    const customerData = result?.[0] ?? {
      customerId: query.customerId,
      totalInvoiced: 0,
      totalPaid: 0,
      totalCount: 0,
      remainingReceivable: 0,
      paymentRate: 0,
      firstInvoiceDate: null,
      lastInvoiceDate: null,
    };

    return {
      customerId: customerData.customerId,
      totalInvoiced: customerData.totalInvoiced,
      totalPaid: customerData.totalPaid,
      remainingReceivable: customerData.remainingReceivable,
      totalCount: customerData.totalCount,
    };
  }
}
