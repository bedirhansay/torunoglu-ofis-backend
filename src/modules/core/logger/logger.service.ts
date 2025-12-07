import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ErrorLog, ErrorLogDocument } from './error.log.schema';

@Injectable()
export class ErrorLoggerService {
  constructor(
    @InjectModel(ErrorLog.name)
    private readonly errorLogModel: Model<ErrorLogDocument>
  ) {}

  async logError(data: Partial<ErrorLog>): Promise<void> {
    await this.errorLogModel.create(data);
  }
}
