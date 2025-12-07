import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { CurrentCompany } from '@common/decorator/company.id';
import {
  ApiBaseResponse,
  ApiCommandResponse,
  ApiPaginatedResponse,
  ApiSearchDatePaginatedQuery,
} from '@common/decorator/swagger';
import { CompanyGuard } from '@common/guards/company.id';

import { PaginatedDateSearchDTO } from '@common/dto/request/pagination.request.dto';
import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { PaginatedResponseDto } from '@common/dto/response/paginated.response.dto';

import { CreatePaymentCommand } from './commands/create-payment.command';
import { DeletePaymentCommand } from './commands/delete-payment.command';
import { UpdatePaymentCommand } from './commands/update-payment.command';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentDto } from './dto/payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { GetPaymentQuery } from './queries/get-payment.query';
import { ListPaymentsByCustomerQuery } from './queries/list-payments-by-customer.query';
import { ListPaymentsQuery } from './queries/list-payments.query';

@ApiTags('Payments')
@ApiBearerAuth('Bearer')
@ApiSecurity('x-company-id')
@UseGuards(CompanyGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  @ApiOperation({ summary: 'Yeni ödeme oluştur', operationId: 'createPayment' })
  @ApiCommandResponse()
  @ApiBody({ type: CreatePaymentDto })
  create(@Body() dto: CreatePaymentDto, @CurrentCompany() companyId: string): Promise<CommandResponseDto> {
    const command = new CreatePaymentCommand(dto, companyId);
    return this.commandBus.execute(command);
  }

  @Get()
  @ApiOperation({ summary: 'Ödemeleri listele', operationId: 'getAllPayments' })
  @ApiSearchDatePaginatedQuery()
  @ApiPaginatedResponse(PaymentDto)
  findAll(
    @Query() query: PaginatedDateSearchDTO,
    @CurrentCompany() companyId: string
  ): Promise<PaginatedResponseDto<PaymentDto>> {
    const listQuery = new ListPaymentsQuery(companyId, query);
    return this.queryBus.execute(listQuery);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Müşteriye ait ödemeleri listele', operationId: 'getPaymentsByCustomer' })
  @ApiParam({ name: 'customerId', description: 'Müşteri ID' })
  @ApiSearchDatePaginatedQuery()
  @ApiPaginatedResponse(PaymentDto)
  getPaymentsByCustomer(
    @Param('customerId') customerId: string,
    @Query() query: PaginatedDateSearchDTO,
    @CurrentCompany() companyId: string
  ): Promise<PaginatedResponseDto<PaymentDto>> {
    const listQuery = new ListPaymentsByCustomerQuery(customerId, companyId, query);
    return this.queryBus.execute(listQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ID ile ödeme getir', operationId: 'getPaymentById' })
  @ApiParam({ name: 'id', description: 'Ödeme ID' })
  @ApiBaseResponse(PaymentDto)
  findOne(@Param('id') id: string, @CurrentCompany() companyId: string): Promise<PaymentDto> {
    const query = new GetPaymentQuery(id, companyId);
    return this.queryBus.execute(query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ödeme güncelle', operationId: 'updatePayment' })
  @ApiParam({ name: 'id', description: 'Ödeme ID' })
  @ApiCommandResponse()
  @ApiBody({ type: UpdatePaymentDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentDto,
    @CurrentCompany() companyId: string
  ): Promise<CommandResponseDto> {
    const command = new UpdatePaymentCommand(id, dto, companyId);
    return this.commandBus.execute(command);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Ödemeyi sil', operationId: 'deletePayment' })
  @ApiParam({ name: 'id', description: 'Ödeme ID' })
  @ApiCommandResponse()
  remove(@Param('id') id: string, @CurrentCompany() companyId: string): Promise<CommandResponseDto> {
    const command = new DeletePaymentCommand(id, companyId);
    return this.commandBus.execute(command);
  }
}
