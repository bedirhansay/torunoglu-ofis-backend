import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CqrsModule } from '@nestjs/cqrs';
import { Category, CategorySchema } from './categories.schema';
import { CategoriesController } from './categories.controller';
import { CreateCategoryHandler } from './commands/handlers/create-category.handler';
import { UpdateCategoryHandler } from './commands/handlers/update-category.handler';
import { DeleteCategoryHandler } from './commands/handlers/delete-category.handler';
import { GetCategoryHandler } from './queries/handlers/get-category.handler';
import { ListCategoriesHandler } from './queries/handlers/list-categories.handler';

const CommandHandlers = [CreateCategoryHandler, UpdateCategoryHandler, DeleteCategoryHandler];
const QueryHandlers = [GetCategoryHandler, ListCategoriesHandler];

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }]),
  ],
  controllers: [CategoriesController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class CategoriesModule {}
