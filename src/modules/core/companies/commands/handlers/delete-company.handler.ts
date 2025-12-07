import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { ensureValidObjectId } from '@common/helper/object.id';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from '../../company.schema';
import { DeleteCompanyCommand } from '../delete-company.command';

@Injectable()
@CommandHandler(DeleteCompanyCommand)
export class DeleteCompanyHandler implements ICommandHandler<DeleteCompanyCommand> {
  private static readonly ERROR_MESSAGES = {
    INVALID_COMPANY_ID: 'Geçersiz şirket ID',
    COMPANY_DELETE_FAILED: 'Silinecek şirket bulunamadı',
  };

  constructor(@InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>) {}

  async execute(command: DeleteCompanyCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.id, DeleteCompanyHandler.ERROR_MESSAGES.INVALID_COMPANY_ID);

    const deleted = await this.companyModel.findByIdAndDelete(command.id).lean().exec();

    if (!deleted) {
      throw new NotFoundException(DeleteCompanyHandler.ERROR_MESSAGES.COMPANY_DELETE_FAILED);
    }

    return {
      statusCode: 204,
      id: deleted._id.toString(),
    };
  }
}
