import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { ensureValidObjectId } from '@common/helper/object.id';
import { VehicleDto } from '../../dto/vehicle.dto';
import { Vehicle, VehicleDocument } from '../../vehicle.schema';
import { GetVehicleQuery } from '../get-vehicle.query';

@Injectable()
@QueryHandler(GetVehicleQuery)
export class GetVehicleHandler implements IQueryHandler<GetVehicleQuery> {
  constructor(
    @InjectModel(Vehicle.name)
    private readonly vehicleModel: Model<VehicleDocument>
  ) {}

  async execute(query: GetVehicleQuery): Promise<VehicleDto> {
    ensureValidObjectId(query.id, 'Geçersiz araç ID');
    ensureValidObjectId(query.companyId, 'Geçersiz firma ID');

    const vehicle = await this.vehicleModel
      .findOne({ _id: new Types.ObjectId(query.id), companyId: new Types.ObjectId(query.companyId) })
      .select('_id plateNumber brand model inspectionDate insuranceDate isActive description driverId companyId createdAt updatedAt')
      .populate('driverId', '_id fullName')
      .lean()
      .exec();

    if (!vehicle) {
      throw new NotFoundException('Araç bulunamadı');
    }

    return plainToInstance(VehicleDto, vehicle, {
      excludeExtraneousValues: true,
    });
  }
}

