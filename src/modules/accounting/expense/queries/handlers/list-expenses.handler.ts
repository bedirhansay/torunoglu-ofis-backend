import { Employee, EmployeeDocument } from '@accounting/employees/employee.schema';
import { Vehicle, VehicleDocument } from '@accounting/vehicles/vehicle.schema';
import { PaginatedResponseDto } from '@common/dto/response/paginated.response.dto';
import { FilterBuilder } from '@common/helper/filter.builder';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model } from 'mongoose';
import { ExpenseDto } from '../../dto/expense.dto';
import { Expense, ExpenseDocument } from '../../expense.schema';
import { ListExpensesQuery } from '../list-expenses.query';

@Injectable()
@QueryHandler(ListExpensesQuery)
export class ListExpensesHandler implements IQueryHandler<ListExpensesQuery> {
  constructor(
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,
    @InjectModel(Vehicle.name)
    private readonly vehicleModel: Model<VehicleDocument>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>
  ) {}

  async execute(query: ListExpensesQuery): Promise<PaginatedResponseDto<ExpenseDto>> {
    const { pageNumber, pageSize, search } = query.query;

    const validPageNumber = FilterBuilder.validatePageNumber(pageNumber);
    const validPageSize = FilterBuilder.validatePageSize(pageSize);

    const filter = FilterBuilder.buildBaseFilter({
      companyId: query.companyId,
      search,
      beginDate: query.query.beginDate,
      endDate: query.query.endDate,
    });

    const rawExpenses = await this.expenseModel
      .find(filter)
      .collation({ locale: 'tr', strength: 1 })
      .sort({ operationDate: -1 })
      .populate('categoryId', 'name')
      .lean()
      .select('-__v')
      .exec();

    const populatedExpenses = await Promise.all(
      rawExpenses.map(async (expense) => {
        const { relatedToId, relatedModel } = expense;

        if (relatedToId && relatedModel) {
          const modelMap: Record<'Vehicle' | 'Employee', { model: Model<any>; select: string }> = {
            Vehicle: {
              model: this.vehicleModel,
              select: 'plateNumber',
            },
            Employee: {
              model: this.employeeModel,
              select: 'fullName',
            },
          };

          const relatedConfig = modelMap[relatedModel as 'Vehicle' | 'Employee'];

          if (relatedConfig) {
            const related = await relatedConfig.model.findById(relatedToId).select(relatedConfig.select).lean();
            return { ...expense, relatedTo: related || null };
          }
        }

        return { ...expense, relatedTo: null };
      })
    );

    const filteredExpenses = search
      ? populatedExpenses.filter((exp) => {
          const lower = search.toLowerCase();
          const relatedTo = exp.relatedTo as { plateNumber?: string; fullName?: string } | null;

          return (
            exp.description?.toLowerCase().includes(lower) ||
            relatedTo?.plateNumber?.toLowerCase().includes(lower) ||
            relatedTo?.fullName?.toLowerCase().includes(lower)
          );
        })
      : populatedExpenses;

    const totalCount = filteredExpenses.length;

    const paginated = filteredExpenses.slice((validPageNumber - 1) * validPageSize, validPageNumber * validPageSize);

    const items = plainToInstance(ExpenseDto, paginated, {
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
