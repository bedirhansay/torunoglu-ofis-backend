import { ICommand } from '@nestjs/cqrs';
import { UpdatePaymentDto } from '../dto/update-payment.dto';

export class UpdatePaymentCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly updatePaymentDto: UpdatePaymentDto,
    public readonly companyId: string,
  ) {}
}

