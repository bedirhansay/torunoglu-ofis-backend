import { Employee, EmployeeDocument } from '../../../../accounting/employees/employee.schema';
import { Vehicle, VehicleDocument } from '../../../../accounting/vehicles/vehicle.schema';
import { Injectable, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { PaginatedResponseDto } from '../../../../../common/dto/response/paginated.response.dto';
import { FilterBuilder } from '../../../../../common/helper/filter.builder';
import { ExpenseDto } from '../../dto/expense.dto';
import { Expense, ExpenseDocument } from '../../expense.schema';
import { ListExpensesQuery } from '../list-expenses.query';

@Injectable()
@QueryHandler(ListExpensesQuery)
export class ListExpensesHandler implements IQueryHandler<ListExpensesQuery> {
  private readonly logger = new Logger(ListExpensesHandler.name);

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

    // Add date range filter using FilterBuilder
    FilterBuilder.addDateRangeFilter(baseFilter, query.query.beginDate, query.query.endDate);

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $match: baseFilter },
      // Lookup category - convert categoryId to ObjectId for proper matching
      {
        $lookup: {
          from: 'categories',
          let: { catId: { $convert: { input: '$categoryId', to: 'objectId', onError: null } } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$catId'] }, { $eq: ['$companyId', new Types.ObjectId(query.companyId)] }],
                },
              },
            },
            { $project: { _id: 1, name: 1, type: 1, description: 1, isActive: 1 } },
          ],
          as: 'categoryId',
        },
      },
      {
        $unwind: {
          path: '$categoryId',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup vehicle (conditional based on relatedModel) - convert relatedToId to ObjectId
      {
        $lookup: {
          from: 'vehicles',
          let: {
            relatedId: { $convert: { input: '$relatedToId', to: 'objectId', onError: null } },
            model: '$relatedModel',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$relatedId'] },
                    { $eq: ['$$model', 'Vehicle'] },
                    { $eq: ['$companyId', new Types.ObjectId(query.companyId)] },
                  ],
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
          let: {
            relatedId: { $convert: { input: '$relatedToId', to: 'objectId', onError: null } },
            model: '$relatedModel',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$relatedId'] },
                    { $eq: ['$$model', 'Employee'] },
                    { $eq: ['$companyId', new Types.ObjectId(query.companyId)] },
                  ],
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
          // Keep all other fields including categoryId and relatedTo
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

    // Debug: Log first item to see what aggregation returns
    if (items.length > 0 && process.env.NODE_ENV === 'development') {
      this.logger.debug('First item from aggregation:', JSON.stringify(items[0], null, 2));
    }

    // Transform items for DTO - similar to get-expense.handler.ts
    const transformedItems = items.map((item: any) => {
      // Start with all fields from aggregation
      const transformed: any = { ...item };

      // Transform categoryId to category object for DTO (same as get-expense.handler.ts)
      if (item.categoryId && typeof item.categoryId === 'object' && item.categoryId._id) {
        transformed.category = {
          id: item.categoryId._id.toString(),
          name: item.categoryId.name || '',
        };
        // Keep original categoryId for compatibility (convert to ObjectId)
        transformed.categoryId = item.categoryId._id;
      } else {
        // If categoryId is not populated, log it for debugging
        if (process.env.NODE_ENV === 'development' && item.categoryId) {
          this.logger.warn(`CategoryId not populated for expense ${item._id}:`, item.categoryId);
        }
        // Still set category field to null so it appears in response
        transformed.category = null;
      }

      // Convert relatedToId ObjectId to string
      if (item.relatedToId) {
        transformed.relatedToId =
          typeof item.relatedToId === 'object' && item.relatedToId.toString
            ? item.relatedToId.toString()
            : item.relatedToId;
      }

      // relatedTo is already in correct format from aggregation ($addFields)
      // Keep it as is (it's already an object with plateNumber or fullName, or null)
      if (
        item.relatedTo &&
        typeof item.relatedTo === 'object' &&
        (item.relatedTo.plateNumber || item.relatedTo.fullName)
      ) {
        transformed.relatedTo = {
          ...(item.relatedTo.plateNumber && { plateNumber: item.relatedTo.plateNumber }),
          ...(item.relatedTo.fullName && { fullName: item.relatedTo.fullName }),
        };
      } else if (item.relatedToId) {
        // If relatedToId exists but relatedTo is null, lookup might have failed
        if (process.env.NODE_ENV === 'development') {
          this.logger.warn(
            `RelatedTo not populated for expense ${item._id}, relatedToId: ${item.relatedToId}, model: ${item.relatedModel}`
          );
        }
        transformed.relatedTo = null;
      } else {
        transformed.relatedTo = undefined;
      }

      return transformed;
    });

    // Use plainToInstance with proper transformation
    // The DTO has @Transform decorator on category that uses obj.categoryId
    // So we need to make sure categoryId is available for the transform, OR
    // we set category directly and it should be used
    const dtoItems: ExpenseDto[] = transformedItems.map((item: any) => {
      // Create a clean object for plainToInstance
      const cleanItem: any = {
        _id: item._id,
        id: item._id?.toString(),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        operationDate: item.operationDate,
        amount: item.amount,
        description: item.description,
        relatedModel: item.relatedModel,
        relatedToId: item.relatedToId,
      };

      // Set category - DTO transform expects obj.categoryId, but we set category directly
      // The @Transform decorator on category field will use obj.categoryId if available
      // Since we already transformed it, we set category directly
      if (item.category) {
        cleanItem.category = item.category;
      } else {
        // If category is null, we still need to set it so it appears in response
        cleanItem.category = null;
      }

      // Also set categoryId for the transform decorator (if it needs it)
      if (item.categoryId) {
        cleanItem.categoryId = item.categoryId;
      }

      // Set relatedTo
      if (item.relatedTo !== undefined) {
        cleanItem.relatedTo = item.relatedTo;
      }

      const dto = plainToInstance(ExpenseDto, cleanItem, {
        excludeExtraneousValues: true,
      }) as any;

      // Force category and relatedTo to be in the response even if plainToInstance excludes them
      dto.category = cleanItem.category ?? null;
      dto.relatedTo = cleanItem.relatedTo ?? null;

      return dto as ExpenseDto;
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
