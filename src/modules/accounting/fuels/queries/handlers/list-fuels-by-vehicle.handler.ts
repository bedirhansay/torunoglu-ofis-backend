import { PaginatedResponseDto } from '@common/dto/response/paginated.response.dto';
import { getFinalDateRange } from '@common/helper/get-date-params';
import { ensureValidObjectId } from '@common/helper/object.id';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import {
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_DEFAULT_PAGE_SIZE,
} from '../../../../../common/constants/pagination.param';
import { FuelDto } from '../../dto/fuel.dto';
import { Fuel, FuelDocument } from '../../fuel.schema';
import { ListFuelsByVehicleQuery } from '../list-fuels-by-vehicle.query';

@Injectable()
@QueryHandler(ListFuelsByVehicleQuery)
export class ListFuelsByVehicleHandler implements IQueryHandler<ListFuelsByVehicleQuery> {
  private static readonly DEFAULT_PAGE_SIZE = 10;
  private static readonly MAX_PAGE_SIZE = 100;

  constructor(
    @InjectModel(Fuel.name)
    private readonly fuelModel: Model<FuelDocument>
  ) {}

  async execute(query: ListFuelsByVehicleQuery): Promise<PaginatedResponseDto<FuelDto>> {
    ensureValidObjectId(query.vehicleId, 'Geçersiz araç ID');
    ensureValidObjectId(query.companyId, 'Geçersiz firma ID');

    const {
      pageNumber = PAGINATION_DEFAULT_PAGE,
      pageSize = PAGINATION_DEFAULT_PAGE_SIZE,
      search,
      beginDate,
      endDate,
    } = query.query;

    const validPageNumber = Math.max(1, Math.floor(pageNumber) || 1);
    const validPageSize = Math.min(
      ListFuelsByVehicleHandler.MAX_PAGE_SIZE,
      Math.max(1, Math.floor(pageSize) || ListFuelsByVehicleHandler.DEFAULT_PAGE_SIZE)
    );

    const { beginDate: finalBeginDate, endDate: finalEndDate } = getFinalDateRange(beginDate, endDate);

    const filter: any = {
      vehicleId: new Types.ObjectId(query.vehicleId),
      companyId: new Types.ObjectId(query.companyId),
    };

    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { invoiceNo: { $regex: search, $options: 'i' } },
        { driverName: { $regex: search, $options: 'i' } },
      ];
    }

    if (finalBeginDate || finalEndDate) {
      filter.operationDate = {};
      if (finalBeginDate) filter.operationDate.$gte = new Date(finalBeginDate);
      if (finalEndDate) filter.operationDate.$lte = new Date(finalEndDate);
    }

    const [totalCount, fuels] = await Promise.all([
      this.fuelModel.countDocuments(filter),
      this.fuelModel
        .find(filter)
        .populate({ path: 'vehicleId', select: 'plateNumber' })
        .collation({ locale: 'tr', strength: 1 })
        .sort({ operationDate: -1 })
        .skip((validPageNumber - 1) * validPageSize)
        .limit(validPageSize)
        .lean()
        .exec(),
    ]);

    const items = plainToInstance(FuelDto, fuels, {
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
