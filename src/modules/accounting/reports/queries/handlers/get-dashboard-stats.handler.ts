import { Customer } from '../../../customers/customer.schema';
import { Employee } from '../../../employees/employee.schema';
import { Expense } from '../../../expenses/expense.schema';
import { Fuel } from '../../../fuels/fuel.schema';
import { Income } from '../../../incomes/income.schema';
import { Vehicle } from '../../../vehicles/vehicle.schema';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { getMonthRange } from '../../../../../common/helper/date';
import { ensureValidObjectId } from '../../../../../common/helper/object.id';
import { DashboardStatsDto } from '../../dto/total-summary-dto';
import { GetDashboardStatsQuery } from '../get-dashboard-stats.query';

@Injectable()
@QueryHandler(GetDashboardStatsQuery)
export class GetDashboardStatsHandler implements IQueryHandler<GetDashboardStatsQuery> {
  private static readonly ERROR_MESSAGES = {
    INVALID_COMPANY_ID: 'Geçersiz şirket ID',
  };

  constructor(
    @InjectModel(Expense.name) private readonly expenseModel: Model<Expense>,
    @InjectModel(Income.name) private readonly incomeModel: Model<Income>,
    @InjectModel(Fuel.name) private readonly fuelModel: Model<Fuel>,
    @InjectModel(Customer.name) private readonly customerModel: Model<Customer>,
    @InjectModel(Vehicle.name) private readonly vehicleModel: Model<Vehicle>,
    @InjectModel(Employee.name) private readonly employeeModel: Model<Employee>
  ) {}

  async execute(query: GetDashboardStatsQuery): Promise<DashboardStatsDto> {
    ensureValidObjectId(query.companyId, GetDashboardStatsHandler.ERROR_MESSAGES.INVALID_COMPANY_ID);

    const companyObjectId = new Types.ObjectId(query.companyId);
    const { beginDate: monthStart, endDate: monthEnd } = getMonthRange();

    const [totalStats, monthlyStats, customerCount, vehicleCount, employeeCount, monthlyTransactionCount] =
      await Promise.all([
        this.getTotalStats(companyObjectId),
        this.getMonthlyStats(companyObjectId, monthStart, monthEnd),
        this.customerModel.countDocuments({ companyId: companyObjectId }),
        this.vehicleModel.countDocuments({ companyId: companyObjectId }),
        this.employeeModel.countDocuments({ companyId: companyObjectId }),
        this.getMonthlyTransactionCount(companyObjectId, monthStart, monthEnd),
      ]);

    return {
      totalIncome: totalStats.totalIncome,
      totalExpense: totalStats.totalExpense,
      totalFuel: totalStats.totalFuel,
      netProfit: totalStats.totalIncome - totalStats.totalExpense - totalStats.totalFuel,
      totalCustomers: customerCount,
      totalVehicles: vehicleCount,
      totalEmployees: employeeCount,
      monthlyTransactions: monthlyTransactionCount,
      monthlyIncome: monthlyStats.monthlyIncome,
      monthlyExpense: monthlyStats.monthlyExpense,
    };
  }

  private async getTotalStats(companyId: Types.ObjectId) {
    const [incomeTotal, expenseTotal, fuelTotal] = await Promise.all([
      this.incomeModel.aggregate([
        { $match: { companyId } },
        { $group: { _id: null, total: { $sum: { $toDouble: '$totalAmount' } } } },
      ]),
      this.expenseModel.aggregate([
        { $match: { companyId } },
        { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } },
      ]),
      this.fuelModel.aggregate([
        { $match: { companyId } },
        { $group: { _id: null, total: { $sum: { $toDouble: '$totalPrice' } } } },
      ]),
    ]);

    return {
      totalIncome: incomeTotal[0]?.total || 0,
      totalExpense: expenseTotal[0]?.total || 0,
      totalFuel: fuelTotal[0]?.total || 0,
    };
  }

  private async getMonthlyStats(companyId: Types.ObjectId, beginDate: Date, endDate: Date) {
    const [monthlyIncome, monthlyExpense] = await Promise.all([
      this.incomeModel.aggregate([
        { $match: { companyId, operationDate: { $gte: beginDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: { $toDouble: '$totalAmount' } } } },
      ]),
      this.expenseModel.aggregate([
        { $match: { companyId, operationDate: { $gte: beginDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } },
      ]),
    ]);

    return {
      monthlyIncome: monthlyIncome[0]?.total || 0,
      monthlyExpense: monthlyExpense[0]?.total || 0,
    };
  }

  private async getMonthlyTransactionCount(companyId: Types.ObjectId, beginDate: Date, endDate: Date): Promise<number> {
    const [incomeCount, expenseCount, fuelCount] = await Promise.all([
      this.incomeModel.countDocuments({ companyId, operationDate: { $gte: beginDate, $lte: endDate } }),
      this.expenseModel.countDocuments({ companyId, operationDate: { $gte: beginDate, $lte: endDate } }),
      this.fuelModel.countDocuments({ companyId, operationDate: { $gte: beginDate, $lte: endDate } }),
    ]);

    return incomeCount + expenseCount + fuelCount;
  }
}
