import { ConflictException, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommandResponseDto } from '../../../../../common';
import { Company, CompanyDocument } from '../../company.schema';
import { CreateCompanyCommand } from '../create-company.command';

@Injectable()
@CommandHandler(CreateCompanyCommand)
export class CreateCompanyHandler implements ICommandHandler<CreateCompanyCommand> {
  private static readonly ERROR_MESSAGES = {
    COMPANY_ALREADY_EXISTS: 'Bu isimde bir şirket zaten mevcut',
  };

  constructor(@InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>) {}

  async execute(command: CreateCompanyCommand): Promise<CommandResponseDto> {
    const existing = await this.companyModel.findOne({ name: command.name }).lean().exec();

    if (existing) {
      throw new ConflictException(CreateCompanyHandler.ERROR_MESSAGES.COMPANY_ALREADY_EXISTS);
    }

    const created = await new this.companyModel({
      name: command.name,
      description: command.description,
    }).save();

    return {
      statusCode: 201,
      id: created.id.toString(),
    };
  }
}
