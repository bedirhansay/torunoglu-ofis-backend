import { PaginatedResponseDto } from '@common/dto/response/paginated.response.dto';
import { FilterBuilder } from '@common/helper/filter.builder';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { VehicleDto } from '../../dto/vehicle.dto';
import { ListVehiclesQuery } from '../list-vehicles.query';
import { Vehicle, VehicleDocument } from '../../vehicle.schema';

@Injectable()
@QueryHandler(ListVehiclesQuery)
export class ListVehiclesHandler implements IQueryHandler<ListVehiclesQuery> {
  constructor(
    @InjectModel(Vehicle.name)
    private readonly vehicleModel: Model<VehicleDocument>
  ) {}

  async execute(query: ListVehiclesQuery): Promise<PaginatedResponseDto<VehicleDto>> {
    const { pageNumber, pageSize, search } = query.query;

    const validPageNumber = FilterBuilder.validatePageNumber(pageNumber);
    const validPageSize = FilterBuilder.validatePageSize(pageSize);

    const filter: any = { companyId: new Types.ObjectId(query.companyId) };

    if (search) {
      FilterBuilder.addSearchFilter(filter, search, ['plateNumber', 'brand', 'model']);
    }

    const [totalCount, vehicles] = await Promise.all([
      this.vehicleModel.countDocuments(filter),
      this.vehicleModel
        .find(filter)
        .sort({ createdAt: -1 })
        .populate('driverId', 'fullName')
        .skip((validPageNumber - 1) * validPageSize)
        .limit(validPageSize)
        .lean()
        .exec(),
    ]);

    const items = plainToInstance(VehicleDto, vehicles, {
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
