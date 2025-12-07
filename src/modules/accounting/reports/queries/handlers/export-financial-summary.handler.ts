import { Expense } from '@accounting/expenses/expense.schema';
import { Fuel } from '@accounting/fuels/fuel.schema';
import { Income } from '@accounting/incomes/income.schema';
import { getMonthRange } from '@common/helper/date';
import { ExcelHelper } from '@common/helper/excel.helper';
import { ensureValidObjectId } from '@common/helper/object.id';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import dayjs from 'dayjs';
import { Response } from 'express';
import { Model, Types } from 'mongoose';
import { DetailedReportDto } from '../../dto/total-summary-dto';
import { ExportFinancialSummaryQuery } from '../export-financial-summary.query';

@Injectable()
export class ExportFinancialSummaryHandler {
  private static readonly ERROR_MESSAGES = {
    INVALID_COMPANY_ID: 'Geçersiz şirket ID',
    INVALID_DATE_RANGE: 'Geçersiz tarih aralığı',
  };

  constructor(
    @InjectModel(Expense.name) private readonly expenseModel: Model<Expense>,
    @InjectModel(Income.name) private readonly incomeModel: Model<Income>,
    @InjectModel(Fuel.name) private readonly fuelModel: Model<Fuel>
  ) {}

  async execute(query: ExportFinancialSummaryQuery, res: Response): Promise<void> {
    ensureValidObjectId(query.companyId, ExportFinancialSummaryHandler.ERROR_MESSAGES.INVALID_COMPANY_ID);

    const { beginDate, endDate } = this.getDateRange(query.dateRange);
    const companyObjectId = new Types.ObjectId(query.companyId);

    const summary = await this.getDetailedSummary(query.dateRange, query.companyId);

    const { workbook, sheet } = ExcelHelper.createWorkbook('Finansal Özet');

    const title = `Finansal Özet Raporu: ${ExcelHelper.formatDate(beginDate)} - ${ExcelHelper.formatDate(endDate)}`;

    ExcelHelper.addTitle(sheet, title, 4);

    let currentRow = 3;
    sheet.getCell(`A${currentRow}`).value = 'GENEL ÖZET';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    currentRow += 2;

    const summaryData = [
      ['Toplam Gelir', `${summary.totalIncome.toLocaleString('tr-TR')} ₺`],
      ['Toplam Gider', `${summary.totalExpense.toLocaleString('tr-TR')} ₺`],
      ['Toplam Yakıt', `${summary.totalFuel.toLocaleString('tr-TR')} ₺`],
      ['Net Kâr', `${summary.netProfit.toLocaleString('tr-TR')} ₺`],
      ['Kâr Marjı', `%${summary.profitMargin}`],
      ['Toplam İşlem', summary.totalTransactions.toString()],
    ];

    summaryData.forEach(([label, value]) => {
      sheet.getCell(`A${currentRow}`).value = label;
      sheet.getCell(`B${currentRow}`).value = value;
      sheet.getCell(`A${currentRow}`).font = { bold: true };
      currentRow++;
    });

    currentRow += 2;
    sheet.getCell(`A${currentRow}`).value = 'GİDER DAĞILIMI';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    currentRow += 2;

    sheet.getCell(`A${currentRow}`).value = 'Kategori';
    sheet.getCell(`B${currentRow}`).value = 'Tutar (₺)';
    sheet.getCell(`C${currentRow}`).value = 'Oran (%)';
    sheet.getRow(currentRow).font = { bold: true };
    currentRow++;

    summary.expenseBreakdown.forEach((item) => {
      sheet.getCell(`A${currentRow}`).value = item.category;
      sheet.getCell(`B${currentRow}`).value = item.amount;
      sheet.getCell(`C${currentRow}`).value = `%${item.percentage}`;
      currentRow++;
    });

    if (summary.monthlyTrends && summary.monthlyTrends.length > 0) {
      currentRow += 2;
      sheet.getCell(`A${currentRow}`).value = 'AYLIK TRENDLERİ';
      sheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
      currentRow += 2;

      sheet.getCell(`A${currentRow}`).value = 'Ay';
      sheet.getCell(`B${currentRow}`).value = 'Gelir (₺)';
      sheet.getCell(`C${currentRow}`).value = 'Gider (₺)';
      sheet.getCell(`D${currentRow}`).value = 'Kâr (₺)';
      sheet.getRow(currentRow).font = { bold: true };
      currentRow++;

      summary.monthlyTrends.forEach((trend) => {
        sheet.getCell(`A${currentRow}`).value = trend.month;
        sheet.getCell(`B${currentRow}`).value = trend.income;
        sheet.getCell(`C${currentRow}`).value = trend.expense;
        sheet.getCell(`D${currentRow}`).value = trend.profit;
        currentRow++;
      });
    }

    sheet.columns.forEach((column) => {
      column.width = 20;
    });

    const fileName = `finansal_ozet_${beginDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.xlsx`;
    await ExcelHelper.sendAsResponse(workbook, res, fileName);
  }

  private async getDetailedSummary(dateRange: any, companyId: string): Promise<DetailedReportDto> {
    ensureValidObjectId(companyId, ExportFinancialSummaryHandler.ERROR_MESSAGES.INVALID_COMPANY_ID);

    const companyObjectId = new Types.ObjectId(companyId);
    const { beginDate, endDate } = this.getDateRange(dateRange);

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
      throw new Error(ExportFinancialSummaryHandler.ERROR_MESSAGES.INVALID_DATE_RANGE);
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
