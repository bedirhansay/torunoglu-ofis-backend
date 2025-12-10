import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { PaginatedResponseDto } from '../../../../../common/dto/response/paginated.response.dto';
import { FilterBuilder } from '../../../../../common/helper/filter.builder';
import { ensureValidObjectId } from '../../../../../common/helper/object.id';
import { ExpenseDto } from '../../dto/expense.dto';
import { Expense, ExpenseDocument } from '../../expense.schema';
import { ListExpensesByVehicleQuery } from '../list-expenses-by-vehicle.query';

@Injectable()
@QueryHandler(ListExpensesByVehicleQuery)
export class ListExpensesByVehicleHandler implements IQueryHandler<ListExpensesByVehicleQuery> {
  constructor(
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>
  ) {}

  async execute(query: ListExpensesByVehicleQuery): Promise<PaginatedResponseDto<ExpenseDto>> {
    ensureValidObjectId(query.vehicleId, 'Geçersiz araç ID');

    const { pageNumber, pageSize, search, beginDate, endDate } = query.query;

    const validPageNumber = FilterBuilder.validatePageNumber(pageNumber);
    const validPageSize = FilterBuilder.validatePageSize(pageSize);

    const filter: any = {
      relatedToId: new Types.ObjectId(query.vehicleId),
      relatedModel: 'Vehicle',
      companyId: new Types.ObjectId(query.companyId),
    };

    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { paymentType: { $regex: search, $options: 'i' } },
      ];
    }

    // Add date range filter using FilterBuilder
    FilterBuilder.addDateRangeFilter(filter, beginDate, endDate);

    const [totalCount, expenses] = await Promise.all([
      this.expenseModel.countDocuments(filter),
      this.expenseModel
        .find(filter)
        .sort({ operationDate: -1 })
        .populate('categoryId', 'name')
        .skip((validPageNumber - 1) * validPageSize)
        .limit(validPageSize)
        .lean()
        .exec(),
    ]);

    const items = plainToInstance(ExpenseDto, expenses, {
      excludeExtraneousValues: true,
    });

    return {
      items,
      pageNumber: validPageNumber,
      totalPages: Math.ceil(totalCount / validPageSize),
      totalCount,
      hasPreviousPage: validPageNumber > 1,
      hasNextPage: validPageNumber * validPageSize < totalCount,
    };
  }
}
