import { Employee, EmployeeDocument } from '@accounting/employees/employee.schema';
import { Vehicle, VehicleDocument } from '@accounting/vehicles/vehicle.schema';
import { ensureValidObjectId } from '@common/helper/object.id';
import { Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { ExpenseDto } from '../../dto/expense.dto';
import { Expense, ExpenseDocument } from '../../expense.schema';
import { GetExpenseQuery } from '../get-expense.query';

@Injectable()
@QueryHandler(GetExpenseQuery)
export class GetExpenseHandler implements IQueryHandler<GetExpenseQuery> {
  constructor(
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,
    @InjectModel(Vehicle.name)
    private readonly vehicleModel: Model<VehicleDocument>,
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>
  ) {}

  async execute(query: GetExpenseQuery): Promise<ExpenseDto> {
    ensureValidObjectId(query.id, 'Geçersiz gider ID');

    // Use aggregation pipeline to avoid N+1 query
    const pipeline = [
      {
        $match: {
          _id: new Types.ObjectId(query.id),
          companyId: new Types.ObjectId(query.companyId),
        },
      },
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
      // Clean up temporary fields
      {
        $project: {
          vehicleRelated: 0,
          employeeRelated: 0,
        },
      },
    ];

    const [expense] = await this.expenseModel.aggregate(pipeline).exec();

    if (!expense) {
      throw new NotFoundException('Gider kaydı bulunamadı');
    }

    // Transform categoryId to category object for DTO
    const transformedExpense: any = { ...expense };

    if (expense.categoryId && typeof expense.categoryId === 'object' && expense.categoryId._id) {
      transformedExpense.category = {
        id: expense.categoryId._id.toString(),
        name: expense.categoryId.name,
      };
      // Keep original categoryId for compatibility
      transformedExpense.categoryId = expense.categoryId._id;
    }

    return plainToInstance(ExpenseDto, transformedExpense, {
      excludeExtraneousValues: true,
    });
  }
}
