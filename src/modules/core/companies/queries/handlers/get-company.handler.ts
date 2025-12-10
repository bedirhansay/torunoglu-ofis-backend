import { Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model } from 'mongoose';
import { ensureValidObjectId } from '../../../../../common/helper/object.id';
import { Company, CompanyDocument } from '../../company.schema';
import { CompanyDto } from '../../dto/company-dto';
import { GetCompanyQuery } from '../get-company.query';
@Injectable()
@QueryHandler(GetCompanyQuery)
export class GetCompanyHandler implements IQueryHandler<GetCompanyQuery> {
  private static readonly ERROR_MESSAGES = {
    INVALID_COMPANY_ID: 'Geçersiz şirket ID',
    COMPANY_NOT_FOUND: 'Şirket bulunamadı',
  };

  constructor(@InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>) {}

  async execute(query: GetCompanyQuery): Promise<CompanyDto> {
    ensureValidObjectId(query.id, GetCompanyHandler.ERROR_MESSAGES.INVALID_COMPANY_ID);

    const company = await this.companyModel.findById(query.id).lean().select('-__v').exec();

    if (!company) {
      throw new NotFoundException(GetCompanyHandler.ERROR_MESSAGES.COMPANY_NOT_FOUND);
    }

    return plainToInstance(CompanyDto, company, {
      excludeExtraneousValues: true,
    });
  }
}
