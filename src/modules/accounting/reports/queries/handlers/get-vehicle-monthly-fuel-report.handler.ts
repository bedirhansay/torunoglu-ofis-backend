import { Fuel } from '../../../../accounting/fuels/fuel.schema';
import { BadRequestException, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import dayjs from 'dayjs';
import { Model, Types } from 'mongoose';
import { VehicleMonthlyFuelReportDto, VehicleMonthlyFuelReportItemDto } from '../../dto/vehicle-monthly-fuel-report.dto';
import { GetVehicleMonthlyFuelReportQuery } from '../get-vehicle-monthly-fuel-report.query';

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
@QueryHandler(GetVehicleMonthlyFuelReportQuery)
export class GetVehicleMonthlyFuelReportHandler
  implements IQueryHandler<GetVehicleMonthlyFuelReportQuery>
{
  constructor(@InjectModel(Fuel.name) private readonly fuelModel: Model<Fuel>) {}

  async execute(query: GetVehicleMonthlyFuelReportQuery): Promise<VehicleMonthlyFuelReportDto> {
    const { companyId, year, month } = query;
    const companyObjectId = new Types.ObjectId(companyId);

    // Ayın başlangıç ve bitiş tarihlerini hesapla
    const startDate = dayjs()
      .year(year)
      .month(month - 1)
      .startOf('month')
      .toDate();
    const endDate = dayjs()
      .year(year)
      .month(month - 1)
      .endOf('month')
      .toDate();

    // Aggregation pipeline: Fuel -> Vehicle lookup -> Group by vehicle -> Sort by total amount
    const pipeline: any[] = [
      // 1. Belirtilen ay ve şirket için fuel kayıtlarını filtrele
      {
        $match: {
          companyId: companyObjectId,
          operationDate: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      // 2. Vehicle bilgilerini lookup ile getir
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicleId',
          foreignField: '_id',
          as: 'vehicle',
          pipeline: [
            {
              $project: {
                plateNumber: 1,
                brand: 1,
                model: 1,
              },
            },
          ],
        },
      },
      // 3. Vehicle array'ini tek obje yap
      {
        $unwind: {
          path: '$vehicle',
          preserveNullAndEmptyArrays: false, // Vehicle bulunamazsa kaydı atla
        },
      },
      // 4. VehicleId'ye göre grupla ve toplam tutarı hesapla
      {
        $group: {
          _id: '$vehicleId',
          plateNumber: { $first: '$vehicle.plateNumber' },
          totalFuelAmount: { $sum: { $toDouble: '$totalPrice' } },
          transactionCount: { $sum: 1 },
        },
      },
      // 5. Toplam miktara göre azalan sırala (en çok yakıt alan araç üstte)
      {
        $sort: {
          totalFuelAmount: -1,
        },
      },
      // 6. Sonuç formatını düzenle
      {
        $project: {
          _id: 0,
          plateNumber: 1,
          totalFuelAmount: { $round: ['$totalFuelAmount', 2] },
          transactionCount: 1,
        },
      },
    ];

    const results = await this.fuelModel.aggregate(pipeline).exec();

    // Toplam tutarı hesapla
    const totalAmount = results.reduce((sum, item) => sum + item.totalFuelAmount, 0);
    const totalTransactionCount = results.reduce((sum, item) => sum + item.transactionCount, 0);

    // DTO formatına dönüştür
    const vehicles: VehicleMonthlyFuelReportItemDto[] = results.map((item) => ({
      plateNumber: item.plateNumber,
      totalFuelAmount: item.totalFuelAmount,
      transactionCount: item.transactionCount,
      year,
      month,
      monthName: monthMap[month],
    }));

    return {
      year,
      month,
      monthName: monthMap[month],
      vehicles,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalTransactionCount,
    };
  }
}

