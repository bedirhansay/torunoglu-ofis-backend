import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CommandResponseDto } from '../../../../../common';
import { ensureValidObjectId } from '../../../../../common/helper/object.id';
import { Category, CategoryDocument } from '../../categories.schema';
import { DeleteCategoryCommand } from '../delete-category.command';

@Injectable()
@CommandHandler(DeleteCategoryCommand)
export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand> {
  private static readonly ERROR_MESSAGES = {
    INVALID_CATEGORY_ID: 'Geçersiz kategori ID',
    CATEGORY_DELETE_FAILED: 'Silinecek kategori bulunamadı',
  };

  constructor(@InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>) {}

  async execute(command: DeleteCategoryCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.id, DeleteCategoryHandler.ERROR_MESSAGES.INVALID_CATEGORY_ID);

    const deleted = await this.categoryModel
      .findOneAndDelete({ _id: new Types.ObjectId(command.id), companyId: new Types.ObjectId(command.companyId) })
      .exec();

    if (!deleted) {
      throw new NotFoundException(DeleteCategoryHandler.ERROR_MESSAGES.CATEGORY_DELETE_FAILED);
    }

    return {
      statusCode: 204,
      id: deleted.id.toString(),
    };
  }
}
