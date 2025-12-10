import { CommandResponseDto } from '../../../../../common';
import { ensureValidObjectId } from '../../../../../common/helper/object.id';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../../categories.schema';
import { UpdateCategoryCommand } from '../update-category.command';

@Injectable()
@CommandHandler(UpdateCategoryCommand)
export class UpdateCategoryHandler implements ICommandHandler<UpdateCategoryCommand> {
  private static readonly ERROR_MESSAGES = {
    INVALID_CATEGORY_ID: 'Geçersiz kategori ID',
    CATEGORY_UPDATE_FAILED: 'Güncellenecek kategori bulunamadı',
    CATEGORY_ALREADY_EXISTS: 'Bu isimde bir kategori zaten mevcut',
  };

  constructor(@InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>) {}

  async execute(command: UpdateCategoryCommand): Promise<CommandResponseDto> {
    const categoryId = command.updateCategoryDto.id || command.id;

    if (command.updateCategoryDto.id && command.updateCategoryDto.id !== command.id) {
      throw new BadRequestException("Route ve body'deki ID değerleri eşleşmiyor");
    }

    ensureValidObjectId(categoryId, UpdateCategoryHandler.ERROR_MESSAGES.INVALID_CATEGORY_ID);

    if (command.updateCategoryDto.name) {
      const exists = await this.categoryModel
        .findOne({
          name: command.updateCategoryDto.name,
          companyId: new Types.ObjectId(command.companyId),
          _id: { $ne: new Types.ObjectId(categoryId) },
        })
        .lean()
        .exec();

      if (exists) {
        throw new ConflictException(UpdateCategoryHandler.ERROR_MESSAGES.CATEGORY_ALREADY_EXISTS);
      }
    }

    const updateData: any = {};
    if (command.updateCategoryDto.name) updateData.name = command.updateCategoryDto.name;
    if (command.updateCategoryDto.description !== undefined)
      updateData.description = command.updateCategoryDto.description;
    if (command.updateCategoryDto.type) updateData.type = command.updateCategoryDto.type;
    if (command.updateCategoryDto.isActive !== undefined) updateData.isActive = command.updateCategoryDto.isActive;

    const updated = await this.categoryModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(categoryId), companyId: new Types.ObjectId(command.companyId) },
        updateData,
        { new: true }
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(UpdateCategoryHandler.ERROR_MESSAGES.CATEGORY_UPDATE_FAILED);
    }

    return {
      statusCode: 200,
      id: updated.id.toString(),
    };
  }
}
