import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from '../../core/companies/company.schema';
import { CreatePaymentHandler } from './commands/handlers/create-payment.handler';
import { DeletePaymentHandler } from './commands/handlers/delete-payment.handler';
import { UpdatePaymentHandler } from './commands/handlers/update-payment.handler';
import { Payment, PaymentSchema } from './payment.schema';
import { PaymentsController } from './payments.controller';
import { GetPaymentHandler } from './queries/handlers/get-payment.handler';
import { ListPaymentsByCustomerHandler } from './queries/handlers/list-payments-by-customer.handler';
import { ListPaymentsHandler } from './queries/handlers/list-payments.handler';

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [
    CreatePaymentHandler,
    UpdatePaymentHandler,
    DeletePaymentHandler,
    GetPaymentHandler,
    ListPaymentsHandler,
    ListPaymentsByCustomerHandler,
  ],
})
export class PaymentsModule {}
