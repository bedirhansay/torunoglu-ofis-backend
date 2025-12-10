import { Expense } from '@accounting/expenses/expense.schema';
import { Fuel } from '@accounting/fuels/fuel.schema';
import { Income } from '@accounting/incomes/income.schema';
import { getMonthRange } from '@common/helper/date';
import { ensureValidObjectId } from '@common/helper/object.id';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import dayjs from 'dayjs';
import { Model, Types } from 'mongoose';
import { DetailedReportDto } from '../../dto/total-summary-dto';
import { GetDetailedSummaryQuery } from '../get-detailed-summary.query';

@Injectable()
@QueryHandler(GetDetailedSummaryQuery)
export class GetDetailedSummaryHandler implements IQueryHandler<GetDetailedSummaryQuery> {
  private static readonly ERROR_MESSAGES = {
    INVALID_COMPANY_ID: 'Geçersiz şirket ID',
    INVALID_DATE_RANGE: 'Geçersiz tarih aralığı',
  };

  constructor(
    @InjectModel(Expense.name) private readonly expenseModel: Model<Expense>,
    @InjectModel(Income.name) private readonly incomeModel: Model<Income>,
    @InjectModel(Fuel.name) private readonly fuelModel: Model<Fuel>
  ) {}

  async execute(query: GetDetailedSummaryQuery): Promise<DetailedReportDto> {
    ensureValidObjectId(query.companyId, GetDetailedSummaryHandler.ERROR_MESSAGES.INVALID_COMPANY_ID);

    const companyObjectId = new Types.ObjectId(query.companyId);
    const { beginDate, endDate } = this.getDateRange(query.dateRange);

    const [totals, expenseBreakdown, monthlyTrends] = await Promise.all([
      this.getTotalStatsForPeriod(companyObjectId, beginDate, endDate),
      this.getExpenseBreakdown(companyObjectId, beginDate, endDate),
      this.getMonthlyTrends(companyObjectId, beginDate, endDate),
    ]);

    const netProfit = totals.totalIncome - totals.totalExpense - totals.totalFuel;
    const profitMargin = totals.totalIncome > 0 ? (netProfit / totals.totalIncome) * 100 : 0;

    return {
      startDate: beginDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalIncome: totals.totalIncome,
      totalExpense: totals.totalExpense,
      totalFuel: totals.totalFuel,
      netProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      totalTransactions: totals.totalTransactions,
      expenseBreakdown,
      monthlyTrends,
    };
  }

  private getDateRange(dateRange: any) {
    let beginDate: Date;
    let endDate: Date;

    if (dateRange.beginDate && dateRange.endDate) {
      beginDate = dayjs(dateRange.beginDate).startOf('day').toDate();
      endDate = dayjs(dateRange.endDate).endOf('day').toDate();
    } else {
      const monthRange = getMonthRange();
      beginDate = monthRange.beginDate;
      endDate = monthRange.endDate;
    }

    if (beginDate > endDate) {
      throw new Error(GetDetailedSummaryHandler.ERROR_MESSAGES.INVALID_DATE_RANGE);
    }

    return { beginDate, endDate };
  }

  private async getTotalStatsForPeriod(companyId: Types.ObjectId, beginDate: Date, endDate: Date) {
    const [incomeData, expenseData, fuelData, transactionCounts] = await Promise.all([
      this.incomeModel.aggregate([
        { $match: { companyId, operationDate: { $gte: beginDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: { $toDouble: '$totalAmount' } } } },
      ]),
      this.expenseModel.aggregate([
        { $match: { companyId, operationDate: { $gte: beginDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } },
      ]),
      this.fuelModel.aggregate([
        { $match: { companyId, operationDate: { $gte: beginDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: { $toDouble: '$totalPrice' } } } },
      ]),
      this.getMonthlyTransactionCount(companyId, beginDate, endDate),
    ]);

    return {
      totalIncome: incomeData[0]?.total || 0,
      totalExpense: expenseData[0]?.total || 0,
      totalFuel: fuelData[0]?.total || 0,
      totalTransactions: transactionCounts,
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

  private async getExpenseBreakdown(companyId: Types.ObjectId, beginDate: Date, endDate: Date) {
    const expenseData = await this.expenseModel.aggregate([
      {
        $match: {
          companyId,
          operationDate: { $gte: beginDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$category.name',
          amount: { $sum: { $toDouble: '$amount' } },
        },
      },
      {
        $project: {
          category: { $ifNull: ['$_id', 'Diğer'] },
          amount: 1,
          _id: 0,
        },
      },
      { $sort: { amount: -1 } },
    ]);

    const totalExpense = expenseData.reduce((sum, item) => sum + item.amount, 0);

    return expenseData.map((item) => ({
      category: item.category,
      amount: item.amount,
      percentage: totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100 * 100) / 100 : 0,
    }));
  }

  private async getMonthlyTrends(companyId: Types.ObjectId, beginDate: Date, endDate: Date) {
    const monthsDiff = dayjs(endDate).diff(dayjs(beginDate), 'month') + 1;

    if (monthsDiff <= 1) {
      return [];
    }

    const [incomeData, expenseData] = await Promise.all([
      this.incomeModel.aggregate([
        {
          $match: {
            companyId,
            operationDate: { $gte: beginDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m',
                date: '$operationDate',
                timezone: 'Europe/Istanbul',
              },
            },
            income: { $sum: { $toDouble: '$totalAmount' } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.expenseModel.aggregate([
        {
          $match: {
            companyId,
            operationDate: { $gte: beginDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m',
                date: '$operationDate',
                timezone: 'Europe/Istanbul',
              },
            },
            expense: { $sum: { $toDouble: '$amount' } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const monthlyMap = new Map();

    incomeData.forEach((item) => {
      const monthKey = item._id;
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { income: 0, expense: 0 });
      }
      monthlyMap.get(monthKey).income = item.income;
    });

    expenseData.forEach((item) => {
      const monthKey = item._id;
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { income: 0, expense: 0 });
      }
      monthlyMap.get(monthKey).expense = item.expense;
    });

    return Array.from(monthlyMap.entries()).map(([monthKey, data]) => ({
      month: dayjs(monthKey).format('MMMM YYYY'),
      income: data.income,
      expense: data.expense,
      profit: data.income - data.expense,
    }));
  }
}
