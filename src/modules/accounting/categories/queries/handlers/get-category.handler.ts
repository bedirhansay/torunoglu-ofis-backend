import { Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { ensureValidObjectId } from '../../../../../common/helper/object.id';
import { BaseResponseDto } from '../../../../../common/types/response/base.response.dto';
import { Category, CategoryDocument } from '../../categories.schema';
import { CategoryDto } from '../../dto/category.dto';
import { GetCategoryQuery } from '../get-category.query';

@Injectable()
@QueryHandler(GetCategoryQuery)
export class GetCategoryHandler implements IQueryHandler<GetCategoryQuery> {
  private static readonly ERROR_MESSAGES = {
    INVALID_CATEGORY_ID: 'Geçersiz kategori ID',
    CATEGORY_NOT_FOUND: 'Kategori bulunamadı',
  };

  constructor(@InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>) {}

  async execute(query: GetCategoryQuery): Promise<BaseResponseDto<CategoryDto>> {
    ensureValidObjectId(query.id, GetCategoryHandler.ERROR_MESSAGES.INVALID_CATEGORY_ID);

    const category = await this.categoryModel
      .findOne({ _id: new Types.ObjectId(query.id), companyId: new Types.ObjectId(query.companyId) })
      .lean()
      .select('-__v')
      .exec();

    if (!category) {
      throw new NotFoundException(GetCategoryHandler.ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    const data = plainToInstance(CategoryDto, category, {
      excludeExtraneousValues: true,
    });

    return { data };
  }
}
