import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateIncomeCommand } from '../create-income.command';
import { Income, IncomeDocument } from '../../income.schema';

@Injectable()
@CommandHandler(CreateIncomeCommand)
export class CreateIncomeHandler implements ICommandHandler<CreateIncomeCommand> {
  constructor(
    @InjectModel(Income.name)
    private readonly incomeModel: Model<IncomeDocument>
  ) {}

  async execute(command: CreateIncomeCommand): Promise<CommandResponseDto> {
    const created = new this.incomeModel({
      ...command.createIncomeDto,
      companyId: new Types.ObjectId(command.companyId),
      customerId: new Types.ObjectId(command.createIncomeDto.customerId),
      categoryId: new Types.ObjectId(command.createIncomeDto.categoryId),
    });
    await created.save();

    return {
      statusCode: 201,
      id: created.id.toString(),
    };
  }
}
