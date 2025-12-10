import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { ensureValidObjectId } from '@common/helper/object.id';
import { FuelDto } from '../../dto/fuel.dto';
import { Fuel, FuelDocument } from '../../fuel.schema';
import { GetFuelQuery } from '../get-fuel.query';

@Injectable()
@QueryHandler(GetFuelQuery)
export class GetFuelHandler implements IQueryHandler<GetFuelQuery> {
  constructor(
    @InjectModel(Fuel.name)
    private readonly fuelModel: Model<FuelDocument>
  ) {}

  async execute(query: GetFuelQuery): Promise<FuelDto> {
    ensureValidObjectId(query.id, 'Geçersiz yakıt ID');
    ensureValidObjectId(query.companyId, 'Geçersiz firma ID');

    const fuel = await this.fuelModel
      .findOne({ _id: new Types.ObjectId(query.id), companyId: new Types.ObjectId(query.companyId) })
      .populate({ path: 'vehicleId', select: 'plateNumber' })
      .lean()
      .exec();

    if (!fuel) {
      throw new NotFoundException('Yakıt kaydı bulunamadı');
    }

    return plainToInstance(FuelDto, fuel, {
      excludeExtraneousValues: true,
    });
  }
}

