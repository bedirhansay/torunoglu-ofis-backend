import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Response } from 'express';
import { Model } from 'mongoose';
import { ExcelColumnConfig, ExcelHelper } from '../../../../../common/helper/excel.helper';
import { FilterBuilder } from '../../../../../common/helper/filter.builder';
import { Fuel, FuelDocument } from '../../fuel.schema';
import { ExportFuelsQuery } from '../export-fuels.query';

@Injectable()
export class ExportFuelsHandler {
  constructor(
    @InjectModel(Fuel.name)
    private readonly fuelModel: Model<FuelDocument>
  ) {}

  async execute(query: ExportFuelsQuery, res: Response): Promise<void> {
    const filter = FilterBuilder.buildBaseFilter({
      companyId: query.companyId,
      search: query.query.search,
      beginDate: query.query.beginDate,
      endDate: query.query.endDate,
    });

    // Add date range filter using FilterBuilder
    FilterBuilder.addDateRangeFilter(filter, query.query.beginDate, query.query.endDate);

    const pipeline: any[] = [
      { $match: filter },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicleId',
          foreignField: '_id',
          as: 'vehicleId',
        },
      },
      {
        $unwind: {
          path: '$vehicleId',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    if (query.query.search) {
      pipeline.push({
        $match: {
          $or: [
            { description: { $regex: query.query.search, $options: 'i' } },
            { invoiceNo: { $regex: query.query.search, $options: 'i' } },
            { driverName: { $regex: query.query.search, $options: 'i' } },
            { 'vehicleId.plateNumber': { $regex: query.query.search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push({ $sort: { operationDate: -1 } });

    const fuels = await this.fuelModel.aggregate(pipeline).exec();

    const { workbook, sheet } = ExcelHelper.createWorkbook('Yakıt Kayıtları');

    const title = `Yakıt Kayıtları (${ExcelHelper.formatDate(new Date(), 'DD.MM.YYYY')})`;

    const columns: ExcelColumnConfig[] = [
      { key: 'invoiceNo', header: 'Fatura No', width: 20 },
      { key: 'plateNumber', header: 'Plaka', width: 15 },
      { key: 'driverName', header: 'Sürücü', width: 20 },
      { key: 'totalPrice', header: 'Tutar', width: 15 },
      { key: 'description', header: 'Açıklama', width: 30 },
      { key: 'operationDate', header: 'İşlem Tarihi', width: 20 },
      { key: 'createdAt', header: 'Kayıt Tarihi', width: 20 },
    ];

    ExcelHelper.addTitle(sheet, title, columns.length);
    ExcelHelper.addHeaders(sheet, columns);

    const data = fuels.map((fuel) => ({
      invoiceNo: fuel.invoiceNo,
      plateNumber: fuel.vehicleId?.plateNumber || 'Bilinmeyen',
      driverName: fuel.driverName || 'Belirtilmemiş',
      totalPrice: `${fuel.totalPrice.toLocaleString('tr-TR')} ₺`,
      description: fuel.description || 'Açıklama yok',
      operationDate: ExcelHelper.formatDate(fuel.operationDate),
      createdAt: ExcelHelper.formatDate(fuel.createdAt),
    }));

    ExcelHelper.addDataRows(sheet, data, (row, item) => {
      row.getCell('invoiceNo').value = item.invoiceNo;
      row.getCell('plateNumber').value = item.plateNumber;
      row.getCell('driverName').value = item.driverName;
      row.getCell('totalPrice').value = item.totalPrice;
      row.getCell('description').value = item.description;
      row.getCell('operationDate').value = item.operationDate;
      row.getCell('createdAt').value = item.createdAt;
    });

    const fileName = `yakit_kayitlari_${new Date().toISOString().split('T')[0]}.xlsx`;
    await ExcelHelper.sendAsResponse(workbook, res, fileName);
  }
}
