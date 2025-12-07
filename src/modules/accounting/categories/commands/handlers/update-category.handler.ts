import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { ensureValidObjectId } from '@common/helper/object.id';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
    ensureValidObjectId(command.id, UpdateCategoryHandler.ERROR_MESSAGES.INVALID_CATEGORY_ID);

    if (command.name) {
      const exists = await this.categoryModel
        .findOne({
          name: command.name,
          companyId: new Types.ObjectId(command.companyId),
          _id: { $ne: new Types.ObjectId(command.id) },
        })
        .lean()
        .exec();

      if (exists) {
        throw new ConflictException(UpdateCategoryHandler.ERROR_MESSAGES.CATEGORY_ALREADY_EXISTS);
      }
    }

    const updateData: any = {};
    if (command.name) updateData.name = command.name;
    if (command.description !== undefined) updateData.description = command.description;
    if (command.type) updateData.type = command.type;
    if (command.isActive !== undefined) updateData.isActive = command.isActive;

    const updated = await this.categoryModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(command.id), companyId: new Types.ObjectId(command.companyId) },
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
