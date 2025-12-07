import { Employee, EmployeeDocument } from '@accounting/employees/employee.schema';
import { Vehicle, VehicleDocument } from '@accounting/vehicles/vehicle.schema';
import { PaginatedResponseDto } from '@common/dto/response/paginated.response.dto';
import { FilterBuilder } from '@common/helper/filter.builder';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
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

    // Base filter (companyId, date range)
    const baseFilter: any = {
      companyId: new Types.ObjectId(query.companyId),
    };

    if (query.query.beginDate || query.query.endDate) {
      baseFilter.operationDate = {};
      if (query.query.beginDate) {
        baseFilter.operationDate.$gte = new Date(query.query.beginDate);
      }
      if (query.query.endDate) {
        baseFilter.operationDate.$lte = new Date(query.query.endDate);
      }
    }

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $match: baseFilter },
      // Lookup category
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'categoryId',
        },
      },
      {
        $unwind: {
          path: '$categoryId',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup vehicle (conditional based on relatedModel)
      {
        $lookup: {
          from: 'vehicles',
          let: { relatedId: '$relatedToId', model: '$relatedModel' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$relatedId'] }, { $eq: ['$$model', 'Vehicle'] }],
                },
              },
            },
            { $project: { plateNumber: 1, _id: 1 } },
          ],
          as: 'vehicleRelated',
        },
      },
      {
        $lookup: {
          from: 'employees',
          let: { relatedId: '$relatedToId', model: '$relatedModel' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$relatedId'] }, { $eq: ['$$model', 'Employee'] }],
                },
              },
            },
            { $project: { fullName: 1, _id: 1 } },
          ],
          as: 'employeeRelated',
        },
      },
      {
        $addFields: {
          relatedTo: {
            $cond: {
              if: { $gt: [{ $size: '$vehicleRelated' }, 0] },
              then: { $arrayElemAt: ['$vehicleRelated', 0] },
              else: {
                $cond: {
                  if: { $gt: [{ $size: '$employeeRelated' }, 0] },
                  then: { $arrayElemAt: ['$employeeRelated', 0] },
                  else: null,
                },
              },
            },
          },
        },
      },
      {
        $project: {
          vehicleRelated: 0,
          employeeRelated: 0,
        },
      },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { description: { $regex: search, $options: 'i' } },
            { 'relatedTo.plateNumber': { $regex: search, $options: 'i' } },
            { 'relatedTo.fullName': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    // Use $facet to get both data and totalCount in one query
    const facetPipeline = [
      ...pipeline,
      {
        $facet: {
          data: [
            { $sort: { operationDate: -1 } },
            { $skip: (validPageNumber - 1) * validPageSize },
            { $limit: validPageSize },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ];

    const [result] = await this.expenseModel.aggregate(facetPipeline).exec();

    const items: any[] = result?.data || [];
    const totalCount = result?.totalCount[0]?.count || 0;

    // Transform categoryId to category object for DTO (ExpenseDto expects 'category' field)
    const transformedItems = items.map((item: any) => {
      const transformed: any = { ...item };

      // Keep categoryId as ObjectId for internal use, but also add category object for DTO
      if (item.categoryId && typeof item.categoryId === 'object' && item.categoryId._id) {
        transformed.category = {
          id: item.categoryId._id.toString(),
          name: item.categoryId.name,
        };
        // Keep original categoryId for compatibility
        transformed.categoryId = item.categoryId._id;
      }

      return transformed;
    });

    const dtoItems: ExpenseDto[] = plainToInstance(ExpenseDto, transformedItems, {
      excludeExtraneousValues: true,
    });

    return {
      items: dtoItems,
      pageNumber: validPageNumber,
      totalPages: Math.ceil(totalCount / validPageSize),
      totalCount,
      hasPreviousPage: validPageNumber > 1,
      hasNextPage: validPageNumber * validPageSize < totalCount,
    };
  }
}
