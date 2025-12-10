import { Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { ensureValidObjectId } from '../../../../../common/helper/object.id';
import { IncomeDto } from '../../dto/income.dto';
import { Income, IncomeDocument } from '../../income.schema';
import { GetIncomeQuery } from '../get-income.query';

@Injectable()
@QueryHandler(GetIncomeQuery)
export class GetIncomeHandler implements IQueryHandler<GetIncomeQuery> {
  private static readonly POPULATE_FIELDS = [
    { path: 'customerId', select: 'name' },
    { path: 'categoryId', select: 'name' },
  ];

  constructor(
    @InjectModel(Income.name)
    private readonly incomeModel: Model<IncomeDocument>
  ) {}

  async execute(query: GetIncomeQuery): Promise<IncomeDto> {
    ensureValidObjectId(query.id, 'Geçersiz gelir ID');

    const income = await this.incomeModel
      .findOne({ _id: new Types.ObjectId(query.id), companyId: new Types.ObjectId(query.companyId) })
      .populate(GetIncomeHandler.POPULATE_FIELDS)
      .lean()
      .exec();

    if (!income) {
      throw new NotFoundException('Gelir kaydı bulunamadı');
    }

    return plainToInstance(IncomeDto, income);
  }
}
