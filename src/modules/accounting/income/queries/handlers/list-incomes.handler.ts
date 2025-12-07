import { Customer, CustomerDocument } from '@accounting/customers/customer.schema';
import { PaginatedResponseDto } from '@common/dto/response/paginated.response.dto';
import { FilterBuilder } from '@common/helper/filter.builder';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { IncomeDto } from '../../dto/income.dto';
import { Income, IncomeDocument } from '../../income.schema';
import { ListIncomesQuery } from '../list-incomes.query';

@Injectable()
@QueryHandler(ListIncomesQuery)
export class ListIncomesHandler implements IQueryHandler<ListIncomesQuery> {
  private static readonly POPULATE_FIELDS = [
    { path: 'customerId', select: 'name' },
    { path: 'categoryId', select: 'name' },
  ];

  constructor(
    @InjectModel(Income.name)
    private readonly incomeModel: Model<IncomeDocument>,
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>
  ) {}

  async execute(query: ListIncomesQuery): Promise<PaginatedResponseDto<IncomeDto>> {
    const { pageNumber, pageSize, search } = query.query;

    const filter = FilterBuilder.buildIncomeFilter({
      companyId: query.companyId,
      search,
      beginDate: query.query?.beginDate,
      endDate: query.query?.endDate,
      isPaid: query.query?.isPaid,
    });

    if (search) {
      const matchedCustomers = await this.findCustomersBySearch(search);
      const customerIds = matchedCustomers.map((c) => new Types.ObjectId(c._id as string));
      FilterBuilder.addCustomerSearchFilter(filter, search, customerIds);
    }

    const [totalCount, data] = await Promise.all([
      this.incomeModel.countDocuments(filter),
      this.incomeModel
        .find(filter)
        .populate(ListIncomesHandler.POPULATE_FIELDS)
        .sort({ operationDate: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec(),
    ]);

    const items = plainToInstance(IncomeDto, data);

    return {
      items,
      pageNumber,
      totalPages: Math.ceil(totalCount / pageSize),
      totalCount,
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber * pageSize < totalCount,
    };
  }

  private async findCustomersBySearch(search: string): Promise<Array<{ _id: string }>> {
    const customers = await this.customerModel
      .find({ name: new RegExp(search, 'i') }, '_id')
      .lean()
      .exec();

    return customers.map((customer) => ({ _id: customer._id.toString() }));
  }
}
