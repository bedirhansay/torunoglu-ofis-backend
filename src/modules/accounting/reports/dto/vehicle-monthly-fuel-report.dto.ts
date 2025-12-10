import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class VehicleMonthlyFuelReportItemDto {
  @ApiProperty({ example: '34ABC123', description: 'Araç plaka numarası' })
  @Expose()
  plateNumber: string;

  @ApiProperty({ example: 15000.75, description: 'Aylık toplam yakıt tutarı (₺)' })
  @Expose()
  totalFuelAmount: number;

  @ApiProperty({ example: 8, description: 'Bu ay yapılan yakıt alım işlemi sayısı' })
  @Expose()
  transactionCount: number;

  @ApiProperty({ example: '2024', description: 'Rapor yılı' })
  @Expose()
  year: number;

  @ApiProperty({ example: 1, description: 'Rapor ayı (1-12)' })
  @Expose()
  month: number;

  @ApiProperty({ example: 'Ocak', description: 'Ay adı' })
  @Expose()
  monthName: string;
}

@Exclude()
export class VehicleMonthlyFuelReportDto {
  @ApiProperty({ example: 2024, description: 'Rapor yılı' })
  @Expose()
  year: number;

  @ApiProperty({ example: 1, description: 'Rapor ayı (1-12)' })
  @Expose()
  month: number;

  @ApiProperty({ example: 'Ocak', description: 'Ay adı' })
  @Expose()
  monthName: string;

  @ApiProperty({
    type: [VehicleMonthlyFuelReportItemDto],
    description: 'Araçlara göre aylık yakıt raporu (toplam miktara göre sıralı)',
  })
  @Expose()
  vehicles: VehicleMonthlyFuelReportItemDto[];

  @ApiProperty({ example: 45000.25, description: 'Tüm araçların toplam yakıt tutarı (₺)' })
  @Expose()
  totalAmount: number;

  @ApiProperty({ example: 25, description: 'Toplam işlem sayısı' })
  @Expose()
  totalTransactionCount: number;
}

