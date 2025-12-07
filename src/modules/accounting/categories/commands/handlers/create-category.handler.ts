import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../../categories.schema';
import { CategoryType } from '../../dto/category.dto';
import { CreateCategoryCommand } from '../create-category.command';

@Injectable()
@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler implements ICommandHandler<CreateCategoryCommand> {
  private static readonly ERROR_MESSAGES = {
    CATEGORY_ALREADY_EXISTS: 'Bu isimde bir kategori zaten mevcut',
    INVALID_CATEGORY_TYPE: 'Geçersiz kategori tipi',
  };

  constructor(@InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>) {}

  async execute(command: CreateCategoryCommand): Promise<CommandResponseDto> {
    const allowedTypes = Object.values(CategoryType);
    if (!allowedTypes.includes(command.type as CategoryType)) {
      throw new BadRequestException(
        `${CreateCategoryHandler.ERROR_MESSAGES.INVALID_CATEGORY_TYPE}. Geçerli değerler: ${allowedTypes.join(', ')}`
      );
    }

    const exists = await this.categoryModel
      .findOne({
        name: command.name,
        companyId: new Types.ObjectId(command.companyId),
      })
      .lean()
      .exec();

    if (exists) {
      throw new ConflictException(CreateCategoryHandler.ERROR_MESSAGES.CATEGORY_ALREADY_EXISTS);
    }

    const created = await new this.categoryModel({
      name: command.name,
      description: command.description,
      type: command.type,
      isActive: command.isActive,
      companyId: new Types.ObjectId(command.companyId),
    }).save();

    return {
      statusCode: 201,
      id: created.id.toString(),
    };
  }
}
