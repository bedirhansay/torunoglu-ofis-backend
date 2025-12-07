import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Response } from 'express';
import { Model, Types } from 'mongoose';
import { ExcelColumnConfig, ExcelHelper } from '@common/helper/excel.helper';
import { Income, IncomeDocument } from '../../income.schema';
import { ExportAllIncomesQuery } from '../export-all-incomes.query';

@Injectable()
export class ExportAllIncomesHandler {
  constructor(
    @InjectModel(Income.name)
    private readonly incomeModel: Model<IncomeDocument>
  ) {}

  async execute(query: ExportAllIncomesQuery, res: Response): Promise<void> {
    const incomes = await this.incomeModel
      .find({ companyId: new Types.ObjectId(query.companyId) })
      .populate('customerId', 'name')
      .populate('categoryId', 'name')
      .sort({ operationDate: -1 })
      .lean()
      .exec();

    const columns: ExcelColumnConfig[] = [
      { key: 'customerName', width: 30, header: 'Müşteri Adı' },
      { key: 'categoryName', width: 25, header: 'Kategori' },
      { key: 'description', width: 40, header: 'Açıklama' },
      { key: 'totalAmount', width: 20, header: 'Tutar (₺)', numFmt: '#,##0.00 ₺' },
      { key: 'unitCount', width: 15, header: 'Kamyon Sayısı' },
      { key: 'isPaid', width: 15, header: 'Ödeme Durumu' },
      { key: 'operationDate', width: 20, header: 'İşlem Tarihi' },
      { key: 'createdAt', width: 20, header: 'Kayıt Tarihi' },
    ];

    const { workbook, sheet } = ExcelHelper.createWorkbook('Tüm Gelirler');

    const title = `Tüm Gelir Kayıtları (${ExcelHelper.formatDate(new Date(), 'DD.MM.YYYY')})`;
    ExcelHelper.addTitle(sheet, title, columns.length);

    ExcelHelper.addHeaders(sheet, columns);

    const data = incomes.map((income: any) => {
      const customer = income.customerId as { name?: string } | null;
      const category = income.categoryId as { name?: string } | null;

      return {
        customerName: customer?.name?.toUpperCase() || 'Bilinmeyen Müşteri',
        categoryName: category?.name?.toUpperCase() || '-',
        description: income.description || '-',
        totalAmount: Number(income.totalAmount || 0),
        unitCount: Number(income.unitCount || 0),
        isPaid: income.isPaid ? 'Ödendi' : 'Ödenmedi',
        isPaidStatus: income.isPaid,
        operationDate: ExcelHelper.formatDate(income.operationDate),
        createdAt: ExcelHelper.formatDate(income.createdAt),
      };
    });

    ExcelHelper.addDataRows(sheet, data, (row, item) => {
      if (item.isPaidStatus === true) {
        for (let i = 1; i <= columns.length; i++) {
          row.getCell(i).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'CCFFCC' },
          };
        }
      }
    });

    await ExcelHelper.sendAsResponse(workbook, res, 'all-incomes.xlsx');
  }
}

