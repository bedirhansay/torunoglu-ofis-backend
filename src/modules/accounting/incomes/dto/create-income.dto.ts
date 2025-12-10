import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsDateString, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../../../common/constants/validation-messages.constants';

export class CreateIncomeDto {
  @ApiProperty({ example: '664cbea1a2170a5c9ef7b412', description: "Gelirin bağlı olduğu müşteri ID'si" })
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING('Müşteri ID') })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Müşteri ID') })
  @IsMongoId({ message: VALIDATION_MESSAGES.IS_MONGO_ID('Müşteri ID') })
  customerId: string;

  @ApiProperty({ example: '664cbea1a2170a5c9ef7b413', description: "Gelir kategorisinin ID'si" })
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING('Kategori ID') })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Kategori ID') })
  @IsMongoId({ message: VALIDATION_MESSAGES.IS_MONGO_ID('Kategori ID') })
  categoryId: string;

  @ApiProperty({ example: 10, description: 'Ürün/hizmet adedi' })
  @IsNumber({}, { message: VALIDATION_MESSAGES.IS_NUMBER('Ürün/hizmet adedi') })
  @IsPositive({ message: VALIDATION_MESSAGES.IS_POSITIVE('Ürün/hizmet adedi') })
  unitCount: number;

  @ApiProperty({ example: 150.75, description: 'Birim fiyatı (₺)' })
  @IsNumber({}, { message: VALIDATION_MESSAGES.IS_NUMBER('Birim fiyatı') })
  @IsPositive({ message: VALIDATION_MESSAGES.IS_POSITIVE('Birim fiyatı') })
  unitPrice: number;

  @ApiProperty({ example: 1507.5, description: 'Toplam gelir tutarı (₺)' })
  @IsNumber({}, { message: VALIDATION_MESSAGES.IS_NUMBER('Toplam tutar') })
  @IsPositive({ message: VALIDATION_MESSAGES.IS_POSITIVE('Toplam tutar') })
  totalAmount: number;

  @ApiPropertyOptional({ example: 'Nakit tahsilat', description: 'İsteğe bağlı açıklama' })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING('Açıklama') })
  description?: string;

  @ApiProperty({ example: '2024-06-15T12:00:00.000Z', description: 'Gelir işlem tarihi' })
  @IsDateString({}, { message: VALIDATION_MESSAGES.IS_DATE('İşlem tarihi') })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('İşlem tarihi') })
  operationDate: string;

  @ApiPropertyOptional({ example: true, description: 'Gelir tahsil edildi mi?' })
  @IsBoolean({ message: VALIDATION_MESSAGES.IS_BOOLEAN('Ödeme durumu') })
  @Expose()
  isPaid: boolean;
}
