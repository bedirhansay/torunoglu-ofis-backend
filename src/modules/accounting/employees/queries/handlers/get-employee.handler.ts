import { Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { ensureValidObjectId } from '../../../../../common/helper/object.id';
import { EmployeeDto } from '../../dto/employee.dto';
import { Employee, EmployeeDocument } from '../../employee.schema';
import { GetEmployeeQuery } from '../get-employee.query';

@Injectable()
@QueryHandler(GetEmployeeQuery)
export class GetEmployeeHandler implements IQueryHandler<GetEmployeeQuery> {
  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>
  ) {}

  async execute(query: GetEmployeeQuery): Promise<EmployeeDto> {
    ensureValidObjectId(query.id, 'Geçersiz çalışan ID');

    const employee = await this.employeeModel
      .findOne({
        _id: new Types.ObjectId(query.id),
        companyId: new Types.ObjectId(query.companyId),
      })
      .lean()
      .exec();

    if (!employee) {
      throw new NotFoundException('Çalışan bulunamadı');
    }

    return plainToInstance(EmployeeDto, employee, {
      excludeExtraneousValues: true,
    });
  }
}
