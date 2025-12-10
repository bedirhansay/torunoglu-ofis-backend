import { CommandResponseDto } from '../../../../../common';
import { ensureValidObjectId } from '../../../../../common/helper/object.id';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DeleteEmployeeCommand } from '../delete-employee.command';
import { Employee, EmployeeDocument } from '../../employee.schema';

@Injectable()
@CommandHandler(DeleteEmployeeCommand)
export class DeleteEmployeeHandler implements ICommandHandler<DeleteEmployeeCommand> {
  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>
  ) {}

  async execute(command: DeleteEmployeeCommand): Promise<CommandResponseDto> {
    ensureValidObjectId(command.id, 'Geçersiz çalışan ID');

    const deleted = await this.employeeModel
      .findOneAndDelete({
        _id: new Types.ObjectId(command.id),
        companyId: new Types.ObjectId(command.companyId),
      })
      .exec();

    if (!deleted) {
      throw new NotFoundException('Silinecek çalışan bulunamadı');
    }

    return {
      statusCode: 204,
      id: deleted.id.toString(),
    };
  }
}
