import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { ensureValidObjectId } from '@common/helper/object.id';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company, CompanyDocument } from '../../company.schema';
import { UpdateCompanyCommand } from '../update-company.command';

@Injectable()
@CommandHandler(UpdateCompanyCommand)
export class UpdateCompanyHandler implements ICommandHandler<UpdateCompanyCommand> {
  private static readonly ERROR_MESSAGES = {
    INVALID_COMPANY_ID: 'Geçersiz şirket ID',
    COMPANY_UPDATE_FAILED: 'Güncellenecek şirket bulunamadı',
    COMPANY_ALREADY_EXISTS: 'Bu isimde bir şirket zaten mevcut',
  };

  constructor(@InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>) {}

  async execute(command: UpdateCompanyCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.id, UpdateCompanyHandler.ERROR_MESSAGES.INVALID_COMPANY_ID);

    if (command.name) {
      const existing = await this.companyModel
        .findOne({
          name: command.name,
          _id: { $ne: new Types.ObjectId(command.id) },
        })
        .lean()
        .exec();

      if (existing) {
        throw new ConflictException(UpdateCompanyHandler.ERROR_MESSAGES.COMPANY_ALREADY_EXISTS);
      }
    }

    const updateData: any = {};
    if (command.name) updateData.name = command.name;
    if (command.description !== undefined) updateData.description = command.description;

    const updated = await this.companyModel.findByIdAndUpdate(command.id, updateData, { new: true }).lean().exec();

    if (!updated) {
      throw new NotFoundException(UpdateCompanyHandler.ERROR_MESSAGES.COMPANY_UPDATE_FAILED);
    }

    return {
      statusCode: 200,
      id: updated._id.toString(),
    };
  }
}
