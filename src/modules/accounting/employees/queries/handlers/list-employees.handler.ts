import { DEFAULT_API_PARAMS } from '../../../../../common/constants';
import { PaginatedResponseDto } from '../../../../../common/dto/response/paginated.response.dto';
import { FilterBuilder } from '../../../../../common/helper/filter.builder';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { EmployeeDto } from '../../dto/employee.dto';
import { Employee, EmployeeDocument } from '../../employee.schema';
import { ListEmployeesQuery } from '../list-employees.query';

@Injectable()
@QueryHandler(ListEmployeesQuery)
export class ListEmployeesHandler implements IQueryHandler<ListEmployeesQuery> {
  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>
  ) {}

  async execute(query: ListEmployeesQuery): Promise<PaginatedResponseDto<EmployeeDto>> {
    const { pageNumber = DEFAULT_API_PARAMS.pageNumber, pageSize = DEFAULT_API_PARAMS.pageSize, search } = query.query;

    const validPageNumber = FilterBuilder.validatePageNumber(pageNumber);
    const validPageSize = FilterBuilder.validatePageSize(pageSize);
    const filter: any = { companyId: new Types.ObjectId(query.companyId) };

    if (search) {
      FilterBuilder.addSearchFilter(filter, search, ['fullName', 'departmentName']);
    }

    const [totalCount, employees] = await Promise.all([
      this.employeeModel.countDocuments(filter),
      this.employeeModel
        .find(filter)
        .select(
          '_id fullName phone departmentName hireDate terminationDate salary isActive description companyId createdAt updatedAt'
        )
        .collation({ locale: 'tr', strength: 1 })
        .sort({ createdAt: -1 })
        .skip((validPageNumber - 1) * validPageSize)
        .limit(validPageSize)
        .lean()
        .exec(),
    ]);

    const items = plainToInstance(EmployeeDto, employees, {
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
