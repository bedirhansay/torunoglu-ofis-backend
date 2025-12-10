import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { ConflictException, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateEmployeeCommand } from '../create-employee.command';
import { Employee, EmployeeDocument } from '../../employee.schema';

@Injectable()
@CommandHandler(CreateEmployeeCommand)
export class CreateEmployeeHandler implements ICommandHandler<CreateEmployeeCommand> {
  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>
  ) {}

  async execute(command: CreateEmployeeCommand): Promise<CommandResponseDto> {
    const existing = await this.employeeModel
      .findOne({
        companyId: new Types.ObjectId(command.companyId),
        fullName: command.createEmployeeDto.fullName,
      })
      .lean()
      .exec();

    if (existing) {
      throw new ConflictException('Bu isimde bir çalışan zaten mevcut');
    }

    const created = await new this.employeeModel({
      ...command.createEmployeeDto,
      companyId: new Types.ObjectId(command.companyId),
    }).save();

    return {
      statusCode: 201,
      id: created.id.toString(),
    };
  }
}
