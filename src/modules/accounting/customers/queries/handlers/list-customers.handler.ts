import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { FilterBuilder } from '../../../../../common/helper/filter.builder';
import { PaginatedResponseDto } from '../../../../../common/types/response/paginated.response.dto';
import { Customer, CustomerDocument } from '../../customer.schema';
import { CustomerDto } from '../../dto/customer.dto';
import { ListCustomersQuery } from '../list-customers.query';

@Injectable()
@QueryHandler(ListCustomersQuery)
export class ListCustomersHandler implements IQueryHandler<ListCustomersQuery> {
  constructor(@InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>) {}

  async execute(query: ListCustomersQuery): Promise<PaginatedResponseDto<CustomerDto>> {
    const { companyId, pageNumber, pageSize, search } = query;

    const validPageNumber = FilterBuilder.validatePageNumber(pageNumber);
    const validPageSize = FilterBuilder.validatePageSize(pageSize);

    const filter: any = { companyId: new Types.ObjectId(companyId) };
    if (search) {
      FilterBuilder.addSearchFilter(filter, search, ['name', 'email', 'phone']);
    }

    const [totalCount, customers] = await Promise.all([
      this.customerModel.countDocuments(filter),
      this.customerModel
        .find(filter)
        .collation({ locale: 'tr', strength: 1 })
        .sort({ createdAt: -1 })
        .skip((validPageNumber - 1) * validPageSize)
        .limit(validPageSize)
        .lean()
        .exec(),
    ]);

    const items = plainToInstance(CustomerDto, customers, {
      excludeExtraneousValues: true,
    });

    return {
      items,
      pageNumber: validPageNumber,
      totalPages: Math.ceil(totalCount / validPageSize),
      totalCount,
      hasPreviousPage: validPageNumber > 1,
      hasNextPage: validPageNumber * validPageSize < totalCount,
    };
  }
}
