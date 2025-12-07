import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import dayjs from 'dayjs';
import { Expense } from '@accounting/expense/expense.schema';
import { Fuel } from '@accounting/fuel/fuel.schema';
import { Income } from '@accounting/income/income.schema';
import { MonthlyReportItemDto } from '../../dto/total-summary-dto';
import { GetMonthlySummaryQuery } from '../get-monthly-summary.query';

const monthMap = [
  '',
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

@Injectable()
@QueryHandler(GetMonthlySummaryQuery)
export class GetMonthlySummaryHandler implements IQueryHandler<GetMonthlySummaryQuery> {
  constructor(
    @InjectModel(Expense.name) private readonly expenseModel: Model<Expense>,
    @InjectModel(Income.name) private readonly incomeModel: Model<Income>,
    @InjectModel(Fuel.name) private readonly fuelModel: Model<Fuel>
  ) {}

  async execute(query: GetMonthlySummaryQuery): Promise<MonthlyReportItemDto[]> {
    const year = query.year || new Date().getFullYear();
    const companyObjectId = new Types.ObjectId(query.companyId);

    const start = dayjs().year(year).startOf('year').toDate();
    const end = dayjs().year(year).endOf('year').toDate();

    const [expenseAgg, incomeAgg, fuelAgg] = await Promise.all([
      this.expenseModel.aggregate([
        {
          $match: {
            companyId: companyObjectId,
            operationDate: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%m',
                date: '$operationDate',
                timezone: 'Europe/Istanbul',
              },
            },
            totalExpense: { $sum: '$amount' },
          },
        },
      ]),
      this.incomeModel.aggregate([
        {
          $match: {
            companyId: companyObjectId,
            operationDate: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%m',
                date: '$operationDate',
                timezone: 'Europe/Istanbul',
              },
            },
            totalIncome: { $sum: '$totalAmount' },
          },
        },
      ]),
      this.fuelModel.aggregate([
        {
          $match: {
            companyId: companyObjectId,
            operationDate: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%m',
                date: '$operationDate',
                timezone: 'Europe/Istanbul',
              },
            },
            totalFuel: { $sum: { $toDouble: '$totalPrice' } },
          },
        },
      ]),
    ]);

    const monthlyData: MonthlyReportItemDto[] = Array.from({ length: 12 }, (_, index) => ({
      monthName: monthMap[index + 1],
      totalIncome: 0,
      totalExpense: 0,
      totalFuel: 0,
    }));

    incomeAgg.forEach((item) => {
      const index = parseInt(item._id, 10) - 1;
      if (monthlyData[index]) {
        monthlyData[index].totalIncome = item.totalIncome;
      }
    });

    expenseAgg.forEach((item) => {
      const index = parseInt(item._id, 10) - 1;
      if (monthlyData[index]) {
        monthlyData[index].totalExpense = item.totalExpense;
      }
    });

    fuelAgg.forEach((item) => {
      const index = parseInt(item._id, 10) - 1;
      if (monthlyData[index]) {
        monthlyData[index].totalFuel = item.totalFuel;
      }
    });

    return monthlyData;
  }
}

