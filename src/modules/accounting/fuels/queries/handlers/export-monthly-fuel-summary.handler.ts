import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Response } from 'express';
import { Model, Types } from 'mongoose';
  import { getLocalDateRange } from '../../../../../common/helper/date-timezone';
import { ExcelColumnConfig, ExcelHelper } from '../../../../../common/helper/excel.helper';
import { Fuel, FuelDocument } from '../../fuel.schema';
import { ExportMonthlyFuelSummaryQuery } from '../export-monthly-fuel-summary.query';

@Injectable()
export class ExportMonthlyFuelSummaryHandler {
  constructor(
    @InjectModel(Fuel.name)
    private readonly fuelModel: Model<FuelDocument>
  ) {}

  async execute(query: ExportMonthlyFuelSummaryQuery, res: Response): Promise<void> {
    const { beginDate, endDate } = getLocalDateRange(query.dateRange.beginDate, query.dateRange.endDate);

    if (!beginDate || !endDate) {
      throw new NotFoundException('Başlangıç ve bitiş tarihleri belirtilmelidir.');
    }

    const fuels = await this.fuelModel
      .find({
        companyId: new Types.ObjectId(query.companyId),
        operationDate: { $gte: beginDate, $lte: endDate },
      })
      .populate('vehicleId', 'plateNumber')
      .lean()
      .exec();

    const grouped = fuels.reduce<Record<string, { plateNumber: string; totalRecords: number; totalAmount: number }>>(
      (acc, fuel) => {
        const plateNumber = ((fuel.vehicleId as any)?.plateNumber || 'Bilinmeyen Araç').toUpperCase();

        if (!acc[plateNumber]) {
          acc[plateNumber] = {
            plateNumber,
            totalRecords: 0,
            totalAmount: 0,
          };
        }

        acc[plateNumber].totalRecords += 1;
        acc[plateNumber].totalAmount += Number(fuel.totalPrice || 0);

        return acc;
      },
      {}
    );

    const { workbook, sheet } = ExcelHelper.createWorkbook('Yakıt Özeti');

    const title = `Yakıt Özeti: ${ExcelHelper.formatDate(beginDate)} - ${ExcelHelper.formatDate(endDate)}`;
    const columns: ExcelColumnConfig[] = [
      { key: 'plateNumber', header: 'Plaka', width: 20 },
      { key: 'totalRecords', header: 'Yakıt Fişi Sayısı', width: 20 },
      { key: 'totalAmount', header: 'Toplam Tutar (₺)', width: 20, numFmt: '#,##0.00 ₺' },
    ];

    ExcelHelper.addTitle(sheet, title, columns.length);
    ExcelHelper.addHeaders(sheet, columns);

    const data = Object.values(grouped);
    let grandTotal = 0;
    let grandCount = 0;

    data.forEach((item) => {
      grandTotal += item.totalAmount;
      grandCount += item.totalRecords;
    });

    ExcelHelper.addDataRows(sheet, data);

    ExcelHelper.addTotalRow(sheet, {
      plateNumber: 'TOPLAM',
      totalRecords: grandCount,
      totalAmount: grandTotal,
    });

    const lastRow = sheet.addRow([]);
    lastRow.getCell(1).value = `Toplam Araç Sayısı: ${data.length}`;
    lastRow.getCell(1).font = { italic: true };
    lastRow.getCell(1).alignment = { horizontal: 'left' };
    lastRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E0FFFF' },
    };

    const fileName = `yakit_ozeti_${new Date().toISOString().split('T')[0]}.xlsx`;
    await ExcelHelper.sendAsResponse(workbook, res, fileName);
  }
}
