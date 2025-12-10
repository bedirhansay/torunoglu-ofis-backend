import { ICommand } from '@nestjs/cqrs';
import { UpdateCategoryCommandDto } from '../dto/update-category.dto';

export class UpdateCategoryCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly updateCategoryDto: UpdateCategoryCommandDto
  ) {}
}
