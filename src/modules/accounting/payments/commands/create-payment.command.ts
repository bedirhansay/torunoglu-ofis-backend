import { ICommand } from '@nestjs/cqrs';
import { CreatePaymentDto } from '../dto/create-payment.dto';

export class CreatePaymentCommand implements ICommand {
  constructor(
    public readonly createPaymentDto: CreatePaymentDto,
    public readonly companyId: string,
  ) {}
}

