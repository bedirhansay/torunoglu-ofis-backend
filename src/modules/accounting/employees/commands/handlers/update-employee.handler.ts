import { CommandResponseDto } from '../../../../../common';
import { ensureValidObjectId } from '../../../../../common/helper/object.id';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Employee, EmployeeDocument } from '../../employee.schema';
import { UpdateEmployeeCommand } from '../update-employee.command';

@Injectable()
@CommandHandler(UpdateEmployeeCommand)
export class UpdateEmployeeHandler implements ICommandHandler<UpdateEmployeeCommand> {
  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>
  ) {}

  async execute(command: UpdateEmployeeCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.id, 'Geçersiz çalışan ID');

    if (command.updateEmployeeDto.fullName) {
      const existing = await this.employeeModel
        .findOne({
          companyId: new Types.ObjectId(command.companyId),
          fullName: command.updateEmployeeDto.fullName,
          _id: { $ne: new Types.ObjectId(command.id) },
        })
        .lean()
        .exec();

      if (existing) {
        throw new ConflictException('Bu isimde bir çalışan zaten mevcut');
      }
    }

    const updated = await this.employeeModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(command.id), companyId: new Types.ObjectId(command.companyId) },
        command.updateEmployeeDto,
        { new: true }
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Güncellenecek çalışan bulunamadı');
    }

    return {
      statusCode: 200,
      id: updated.id.toString(),
    };
  }
}
