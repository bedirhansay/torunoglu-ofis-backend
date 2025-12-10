import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../../../common/constants/validation-messages.constants';
import { CreateCategoryCommandDto } from './create-category.dto';

export class UpdateCategoryCommandDto extends PartialType(CreateCategoryCommandDto) {
  @ApiPropertyOptional({
    description: 'Kategori ID (isteğe bağlı, path parameter ile aynı olmalı)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING('Kategori ID') })
  id?: string;
}
