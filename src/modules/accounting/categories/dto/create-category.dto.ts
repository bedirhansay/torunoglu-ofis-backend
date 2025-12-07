import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { VALIDATION_MESSAGES } from '@common/constants/validation-messages.constants';
import { CategoryType } from './category.dto';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Kategori adı',
    example: 'Elektrik Gideri',
  })
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING('Kategori adı') })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Kategori adı') })
  @Length(2, 100, { message: VALIDATION_MESSAGES.LENGTH('Kategori adı', 2, 100) })
  name: string;

  @ApiPropertyOptional({
    description: 'Kategoriye ait açıklama',
    example: 'Aylık düzenli elektrik faturaları',
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING('Açıklama') })
  @Length(0, 500, { message: VALIDATION_MESSAGES.MAX_LENGTH('Açıklama', 500) })
  description?: string;

  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.IS_BOOLEAN('Aktiflik durumu') })
  isActive?: boolean;

  @ApiProperty({
    description: 'Kategori tipi (income = gelir, expense = gider)',
    enum: CategoryType,
    example: CategoryType.EXPENSE,
  })
  @IsEnum(CategoryType, {
    message: VALIDATION_MESSAGES.IS_ENUM('Kategori tipi', Object.values(CategoryType)),
  })
  type: CategoryType;
}
