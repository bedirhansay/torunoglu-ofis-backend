import { ICommand } from '@nestjs/cqrs';
import { CreateCategoryCommandDto } from '../dto/create-category.dto';

export class CreateCategoryCommand implements ICommand {
  constructor(
    public readonly createCategoryDto: CreateCategoryCommandDto,
    public readonly companyId: string
  ) {}
}
