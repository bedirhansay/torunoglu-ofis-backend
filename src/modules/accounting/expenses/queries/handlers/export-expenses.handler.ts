import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import dayjs from 'dayjs';
import { Response } from 'express';
import { Model, Types } from 'mongoose';
import { getLocalDateRange } from '../../../../../common/helper/date-timezone';
import { ExcelColumnConfig, ExcelHelper } from '../../../../../common/helper/excel.helper';
import { ensureValidObjectId } from '../../../../../common/helper/object.id';
import { Expense, ExpenseDocument } from '../../expense.schema';
import { ExportExpensesQuery } from '../export-expenses.query';

@Injectable()
export class ExportExpensesHandler {
  constructor(
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>
  ) {}

  async execute(query: ExportExpensesQuery, res: Response): Promise<void> {
    ensureValidObjectId(query.companyId, 'Geçersiz firma ID');

    const { beginDate, endDate } = getLocalDateRange(query.dateRange.beginDate, query.dateRange.endDate);

    const expenses = await this.expenseModel
      .find({
        companyId: new Types.ObjectId(query.companyId),
        operationDate: { $gte: beginDate, $lte: endDate },
      })
      .populate('categoryId', 'name')
      .lean()
      .exec();

    const grouped = expenses.reduce<Record<string, number>>((acc, exp) => {
      const categoryName =
        typeof exp.categoryId === 'object' && 'name' in exp.categoryId
          ? (exp.categoryId as any).name
          : 'Bilinmeyen Kategori';

      acc[categoryName] = (acc[categoryName] || 0) + Number(exp.amount);
      return acc;
    }, {});

    const { workbook, sheet } = ExcelHelper.createWorkbook('Gider Özeti');

    const title = `Masraf Özeti: ${ExcelHelper.formatDate(beginDate)} - ${ExcelHelper.formatDate(endDate)}`;
    const columns: ExcelColumnConfig[] = [
      { key: 'categoryName', header: 'Kategori Adı', width: 30 },
      { key: 'totalAmount', header: 'Toplam Tutar (₺)', width: 20, numFmt: '#,##0.00 ₺' },
    ];

    ExcelHelper.addTitle(sheet, title, columns.length);
    ExcelHelper.addHeaders(sheet, columns);

    const data = Object.entries(grouped).map(([categoryName, totalAmount]) => ({
      categoryName: categoryName.toUpperCase(),
      totalAmount,
    }));

    let totalSum = 0;

    ExcelHelper.addDataRows(sheet, data, (row, item) => {
      totalSum += item.totalAmount;
    });

    ExcelHelper.addTotalRow(sheet, {
      categoryName: 'TOPLAM',
      totalAmount: totalSum,
    });

    const fileName = `gider-ozeti-${dayjs().format('YYYY-MM-DD')}.xlsx`;
    await ExcelHelper.sendAsResponse(workbook, res, fileName);
  }
}
