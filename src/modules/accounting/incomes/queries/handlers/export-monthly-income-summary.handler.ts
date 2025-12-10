import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Response } from 'express';
import { Model, Types } from 'mongoose';
import { getLocalDateRange } from '../../../../../common/helper/date-timezone';
import { ExcelColumnConfig, ExcelHelper } from '../../../../../common/helper/excel.helper';
import { Income, IncomeDocument } from '../../income.schema';
import { ExportMonthlyIncomeSummaryQuery } from '../export-monthly-income-summary.query';

type PopulatedIncome = Omit<Income, 'customerId'> & {
  customerId: { name: string } | null;
};

@Injectable()
export class ExportMonthlyIncomeSummaryHandler {
  constructor(
    @InjectModel(Income.name)
    private readonly incomeModel: Model<IncomeDocument>
  ) {}

  async execute(query: ExportMonthlyIncomeSummaryQuery, res: Response): Promise<void> {
    const { beginDate, endDate } = getLocalDateRange(query.dateRange.beginDate, query.dateRange.endDate);

    if (!beginDate || !endDate) {
      throw new NotFoundException('Başlangıç ve bitiş tarihleri belirtilmelidir.');
    }

    const incomes = (await this.incomeModel
      .find({
        companyId: new Types.ObjectId(query.companyId),
        operationDate: { $gte: beginDate, $lte: endDate },
      })
      .populate('customerId', 'name')
      .lean()
      .exec()) as unknown as PopulatedIncome[];

    const grouped = this.groupIncomesByCustomer(incomes);

    const columns: ExcelColumnConfig[] = [
      { key: 'customerName', width: 30, header: 'Müşteri Adı' },
      { key: 'totalDocuments', width: 15, header: 'Yükleme Seferi' },
      { key: 'totalUnitCount', width: 20, header: 'Toplam Kamyon Sayısı' },
      { key: 'totalAmount', width: 20, header: 'Toplam Tutar (₺)', numFmt: '#,##0.00 ₺' },
      { key: 'paidAmount', width: 20, header: 'Ödenmiş Tutar (₺)', numFmt: '#,##0.00 ₺' },
      { key: 'unpaidAmount', width: 20, header: 'Ödenmemiş Tutar (₺)', numFmt: '#,##0.00 ₺' },
      { key: 'remainingAmount', width: 20, header: 'Kalan Ödeme (₺)', numFmt: '#,##0.00 ₺' },
    ];

    const { workbook, sheet } = ExcelHelper.createWorkbook('Gelir Özeti');

    const title = `Yükleme Özeti: ${ExcelHelper.formatDate(beginDate)} - ${ExcelHelper.formatDate(endDate)}`;
    ExcelHelper.addTitle(sheet, title, columns.length);

    ExcelHelper.addHeaders(sheet, columns);

    const { data, totals } = this.prepareIncomesSummaryData(grouped);

    ExcelHelper.addDataRows(sheet, data, (row, item) => {
      if (item.remainingAmount === 0) {
        for (let i = 1; i <= columns.length; i++) {
          row.getCell(i).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'CCFFCC' },
          };
        }
      }
    });

    ExcelHelper.addTotalRow(sheet, { customerName: 'TOPLAM', ...totals });

    const lastRow = sheet.addRow([]);
    lastRow.getCell(1).value = `Toplam Firma Sayısı: ${Object.keys(grouped).length}`;
    lastRow.getCell(1).font = { italic: true };
    lastRow.getCell(1).alignment = { horizontal: 'left' };
    lastRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E0FFFF' },
    };

    await ExcelHelper.sendAsResponse(workbook, res, 'incomes-summary.xlsx');
  }

  private groupIncomesByCustomer(
    incomes: Array<{ customerId: { name: string } | null; totalAmount: number; unitCount: number; isPaid: boolean }>
  ) {
    return incomes.reduce<
      Record<
        string,
        {
          totalDocuments: number;
          totalUnitCount: number;
          totalAmount: number;
          paidAmount: number;
          unpaidAmount: number;
        }
      >
    >((acc, income) => {
      const name = income.customerId?.name || 'Bilinmeyen Müşteri';

      if (!acc[name]) {
        acc[name] = {
          totalDocuments: 0,
          totalUnitCount: 0,
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
        };
      }

      const total = Number(income.totalAmount || 0);
      const isPaid = income.isPaid === true;

      acc[name].totalDocuments += 1;
      acc[name].totalUnitCount += Number(income.unitCount || 0);
      acc[name].totalAmount += total;
      acc[name].paidAmount += isPaid ? total : 0;
      acc[name].unpaidAmount += !isPaid ? total : 0;

      return acc;
    }, {});
  }

  private prepareIncomesSummaryData(grouped: Record<string, any>) {
    const totals = {
      totalDocuments: 0,
      totalUnitCount: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      remainingAmount: 0,
    };

    const data = Object.entries(grouped).map(([customerName, data]) => {
      const remainingAmount = data.unpaidAmount;

      totals.totalDocuments += data.totalDocuments;
      totals.totalUnitCount += data.totalUnitCount;
      totals.totalAmount += data.totalAmount;
      totals.paidAmount += data.paidAmount;
      totals.unpaidAmount += data.unpaidAmount;
      totals.remainingAmount += remainingAmount;

      return {
        customerName: customerName.toUpperCase(),
        ...data,
        remainingAmount,
      };
    });

    return { data, totals };
  }
}

