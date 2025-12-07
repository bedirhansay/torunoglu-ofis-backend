import { PaginatedResponseDto } from '@common/dto/response/paginated.response.dto';
import { FilterBuilder } from '@common/helper/filter.builder';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../../categories.schema';
import { CategoryDto } from '../../dto/category.dto';
import { ListCategoriesQuery } from '../list-categories.query';

@Injectable()
@QueryHandler(ListCategoriesQuery)
export class ListCategoriesHandler implements IQueryHandler<ListCategoriesQuery> {
  private static readonly DEFAULT_PAGE_SIZE = 10;
  private static readonly MAX_PAGE_SIZE = 100;

  constructor(@InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>) {}

  async execute(query: ListCategoriesQuery): Promise<PaginatedResponseDto<CategoryDto>> {
    const { companyId, pageNumber = 1, pageSize = 10, search } = query;

    const validPageNumber = FilterBuilder.validatePageNumber(pageNumber);
    const validPageSize = FilterBuilder.validatePageSize(pageSize);

    const filter: any = {
      companyId: new Types.ObjectId(companyId),
    };

    if (search) {
      filter.$or = [{ name: { $regex: search, $options: 'i' } }];
    }

    const [totalCount, categories] = await Promise.all([
      this.categoryModel.countDocuments(filter),
      this.categoryModel
        .find(filter)
        .collation({ locale: 'tr', strength: 1 })
        .sort({ createdAt: -1 })
        .skip((validPageNumber - 1) * validPageSize)
        .limit(validPageSize)
        .select('-__v')
        .lean()
        .exec(),
    ]);

    const items = plainToInstance(CategoryDto, categories, {
      excludeExtraneousValues: true,
    });

    return {
      items,
      pageNumber: validPageNumber,
      totalCount,
      totalPages: Math.ceil(totalCount / validPageSize),
      hasPreviousPage: validPageNumber > 1,
      hasNextPage: validPageNumber * validPageSize < totalCount,
    };
  }
}
