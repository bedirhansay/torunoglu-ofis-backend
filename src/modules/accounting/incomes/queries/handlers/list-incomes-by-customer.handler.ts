import { PaginatedResponseDto } from '@common/dto/response/paginated.response.dto';
import { FilterBuilder } from '@common/helper/filter.builder';
import { ensureValidObjectId } from '@common/helper/object.id';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model } from 'mongoose';
import { IncomeDto } from '../../dto/income.dto';
import { Income, IncomeDocument } from '../../income.schema';
import { ListIncomesByCustomerQuery } from '../list-incomes-by-customer.query';

@Injectable()
@QueryHandler(ListIncomesByCustomerQuery)
export class ListIncomesByCustomerHandler implements IQueryHandler<ListIncomesByCustomerQuery> {
  constructor(
    @InjectModel(Income.name)
    private readonly incomeModel: Model<IncomeDocument>
  ) {}

  async execute(query: ListIncomesByCustomerQuery): Promise<PaginatedResponseDto<IncomeDto>> {
    ensureValidObjectId(query.customerId, 'Geçersiz müşteri ID');

    const { pageNumber, pageSize, search, beginDate, endDate } = query.query;

    const filter = FilterBuilder.buildIncomeFilter({
      companyId: query.companyId,
      search,
      beginDate,
      endDate,
      customerId: query.customerId,
    });

    const [totalCount, incomes] = await Promise.all([
      this.incomeModel.countDocuments(filter),
      this.incomeModel
        .find(filter)
        .populate('customerId', 'name')
        .populate('categoryId', 'name')
        .sort({ operationDate: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec(),
    ]);

    const items = plainToInstance(IncomeDto, incomes);

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
