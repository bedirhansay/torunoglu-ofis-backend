import { PaginatedResponseDto } from '@common/dto/response/paginated.response.dto';
import { FilterBuilder } from '@common/helper/filter.builder';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model } from 'mongoose';
import { FuelDto } from '../../dto/fuel.dto';
import { Fuel, FuelDocument } from '../../fuel.schema';
import { ListFuelsQuery } from '../list-fuels.query';

@Injectable()
@QueryHandler(ListFuelsQuery)
export class ListFuelsHandler implements IQueryHandler<ListFuelsQuery> {
  constructor(
    @InjectModel(Fuel.name)
    private readonly fuelModel: Model<FuelDocument>
  ) {}

  async execute(query: ListFuelsQuery): Promise<PaginatedResponseDto<FuelDto>> {
    const { pageNumber, pageSize, search, beginDate, endDate } = query.query;

    const validPageNumber = FilterBuilder.validatePageNumber(pageNumber);
    const validPageSize = FilterBuilder.validatePageSize(pageSize);

    const filter = FilterBuilder.buildBaseFilter({
      companyId: query.companyId,
      search,
      beginDate,
      endDate,
    });

    const pipeline: any[] = [
      { $match: filter },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicleId',
          foreignField: '_id',
          as: 'vehicleId',
        },
      },
      {
        $unwind: {
          path: '$vehicleId',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { description: { $regex: search, $options: 'i' } },
            { invoiceNo: { $regex: search, $options: 'i' } },
            { driverName: { $regex: search, $options: 'i' } },
            { 'vehicleId.plateNumber': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    const [data, totalCountResult] = await Promise.all([
      this.fuelModel
        .aggregate([
          ...pipeline,
          { $sort: { operationDate: -1 } },
          { $skip: (validPageNumber - 1) * validPageSize },
          { $limit: validPageSize },
        ])
        .exec(),
      this.fuelModel.aggregate([...pipeline, { $count: 'count' }]).exec(),
    ]);

    const totalCount = totalCountResult[0]?.count || 0;

    const items = plainToInstance(FuelDto, data, {
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
