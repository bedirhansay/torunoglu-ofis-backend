import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Model, Types } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { ensureValidObjectId } from '@common/helper/object.id';
import { GetCustomerQuery } from '../get-customer.query';
import { Customer, CustomerDocument } from '../../customer.schema';
import { CustomerDto } from '../../dto/customer.dto';

@Injectable()
@QueryHandler(GetCustomerQuery)
export class GetCustomerHandler implements IQueryHandler<GetCustomerQuery> {
  private static readonly ERROR_MESSAGES = {
    INVALID_CUSTOMER_ID: 'Geçersiz müşteri ID',
    CUSTOMER_NOT_FOUND: 'Müşteri bulunamadı',
  };

  constructor(@InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>) {}

  async execute(query: GetCustomerQuery): Promise<CustomerDto> {
    ensureValidObjectId(query.id, GetCustomerHandler.ERROR_MESSAGES.INVALID_CUSTOMER_ID);

    const customer = await this.customerModel
      .findOne({ _id: new Types.ObjectId(query.id), companyId: new Types.ObjectId(query.companyId) })
      .lean()
      .exec();

    if (!customer) {
      throw new NotFoundException(GetCustomerHandler.ERROR_MESSAGES.CUSTOMER_NOT_FOUND);
    }

    return plainToInstance(CustomerDto, customer, {
      excludeExtraneousValues: true,
    });
  }
}

