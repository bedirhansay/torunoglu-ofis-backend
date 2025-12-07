import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CqrsModule } from '@nestjs/cqrs';
import { Customer, CustomerSchema } from './customer.schema';
import { CustomersController } from './customers.controller';
import { CreateCustomerHandler } from './commands/handlers/create-customer.handler';
import { UpdateCustomerHandler } from './commands/handlers/update-customer.handler';
import { DeleteCustomerHandler } from './commands/handlers/delete-customer.handler';
import { GetCustomerHandler } from './queries/handlers/get-customer.handler';
import { ListCustomersHandler } from './queries/handlers/list-customers.handler';

const CommandHandlers = [CreateCustomerHandler, UpdateCustomerHandler, DeleteCustomerHandler];
const QueryHandlers = [GetCustomerHandler, ListCustomersHandler];

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }]),
  ],
  controllers: [CustomersController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [],
})
export class CustomersModule {}
