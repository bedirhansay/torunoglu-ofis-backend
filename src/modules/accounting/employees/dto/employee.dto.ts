import { BaseDto } from '../../../../common/dto/base/base.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';

@Exclude()
export class EmployeeDto extends BaseDto {
  @ApiProperty({ example: 'Ahmet Yılmaz', description: 'Çalışanın tam adı' })
  @Expose()
  fullName: string;

  @ApiPropertyOptional({ example: '+90 532 123 45 67', description: 'Telefon numarası' })
  @Expose()
  phone?: string;

  @ApiProperty({ example: 'Muhasebe', description: 'Departman adı' })
  @Expose()
  departmentName: string;

  @ApiPropertyOptional({ example: '2024-06-01T00:00:00.000Z', description: 'İşe giriş tarihi' })
  @Expose()
  hireDate?: string;

  @ApiPropertyOptional({ example: '2024-12-01T00:00:00.000Z', description: 'İşten ayrılış tarihi' })
  @Expose()
  terminationDate?: string;

  @ApiPropertyOptional({ example: 15000, description: 'Maaş (₺)' })
  @IsOptional()
  @Expose()
  salary?: number;

  @ApiProperty({ example: true, description: 'Çalışan aktif mi?' })
  @Expose()
  isActive: boolean;

  @ApiPropertyOptional({ example: 'Kıdemli çalışan', description: 'Notlar' })
  @Expose()
  description?: string;
}
