import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { ensureValidObjectId } from '@common/helper/object.id';
import { ExpenseDto } from '../../dto/expense.dto';
import { Expense, ExpenseDocument } from '../../expense.schema';
import { Vehicle, VehicleDocument } from '@accounting/vehicles/vehicle.schema';
import { Employee, EmployeeDocument } from '@accounting/employees/employee.schema';
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

    const expense = await this.expenseModel
      .findOne({ _id: new Types.ObjectId(query.id), companyId: new Types.ObjectId(query.companyId) })
      .populate('categoryId', 'name')
      .lean()
      .exec();

    if (!expense) {
      throw new NotFoundException('Gider kaydı bulunamadı');
    }

    const finalExpense = {
      ...expense,
      relatedTo: null,
    } as typeof expense & { relatedTo: any | null };

    if (expense.relatedToId && expense.relatedModel) {
      const modelMap: Record<'Vehicle' | 'Employee', Model<any>> = {
        Vehicle: this.vehicleModel,
        Employee: this.employeeModel,
      };

      const model = modelMap[expense.relatedModel as 'Vehicle' | 'Employee'];

      if (model) {
        const related = await model.findById(expense.relatedToId).select('plateNumber fullName').lean();
        finalExpense.relatedTo = related || null;
      }
    }

    return plainToInstance(ExpenseDto, finalExpense, {
      excludeExtraneousValues: true,
    });
  }
}

