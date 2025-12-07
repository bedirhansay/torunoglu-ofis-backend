import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

import { CurrentCompany } from '@common/decorator/company.id';
import {
  ApiBaseResponse,
  ApiCommandResponse,
  ApiIncomeQueryDto,
  ApiPaginatedResponse,
  ApiSearchDatePaginatedQuery,
} from '@common/decorator/swagger';
import { CompanyGuard } from '@common/guards/company.id';

import { PaginatedDateSearchDTO } from '@common/dto/request/pagination.request.dto';
import { BaseResponseDto } from '@common/dto/response/base.response.dto';
import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { PaginatedResponseDto } from '@common/dto/response/paginated.response.dto';

import { DateRangeDto } from '@common/dto/request';
import { CreateIncomeCommand } from './commands/create-income.command';
import { DeleteIncomeCommand } from './commands/delete-income.command';
import { UpdateIncomeCommand } from './commands/update-income.command';
import { CreateIncomeDto } from './dto/create-income.dto';
import { IncomeDto } from './dto/income.dto';
import { IncomeQueryDto } from './dto/query-dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { ExportAllIncomesQuery } from './queries/export-all-incomes.query';
import { ExportMonthlyIncomeSummaryQuery } from './queries/export-monthly-income-summary.query';
import { GetIncomeQuery } from './queries/get-income.query';
import { ExportAllIncomesHandler } from './queries/handlers/export-all-incomes.handler';
import { ExportMonthlyIncomeSummaryHandler } from './queries/handlers/export-monthly-income-summary.handler';
import { ListIncomesByCustomerQuery } from './queries/list-incomes-by-customer.query';
import { ListIncomesQuery } from './queries/list-incomes.query';

@ApiTags('Incomes')
@ApiBearerAuth('Bearer')
@ApiSecurity('x-company-id')
@ApiExtraModels(
  IncomeDto,
  CreateIncomeDto,
  UpdateIncomeDto,
  PaginatedDateSearchDTO,
  PaginatedResponseDto,
  BaseResponseDto,
  CommandResponseDto
)
@UseGuards(CompanyGuard)
@Controller('incomes')
export class IncomeController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly exportAllIncomesHandler: ExportAllIncomesHandler,
    private readonly exportMonthlyIncomeSummaryHandler: ExportMonthlyIncomeSummaryHandler
  ) {}

  @Post()
  @ApiOperation({ summary: 'Yeni gelir oluşturur', operationId: 'createIncome' })
  @ApiCommandResponse()
  @ApiBody({ type: CreateIncomeDto })
  create(@Body() dto: CreateIncomeDto, @CurrentCompany() companyId: string): Promise<CommandResponseDto> {
    const command = new CreateIncomeCommand(dto, companyId);
    return this.commandBus.execute(command);
  }

  @Get()
  @ApiOperation({ summary: 'Tüm gelirleri sayfalı olarak listeler', operationId: 'getAllIncomes' })
  @ApiIncomeQueryDto()
  @ApiPaginatedResponse(IncomeDto)
  findAll(
    @Query() query: IncomeQueryDto,
    @CurrentCompany() companyId: string
  ): Promise<PaginatedResponseDto<IncomeDto>> {
    const listQuery = new ListIncomesQuery(companyId, query);
    return this.queryBus.execute(listQuery);
  }

  @Get('export/all')
  @ApiOperation({
    summary: 'Tüm gelirleri Excel dosyası olarak dışa aktarır',
    operationId: 'exportAllIncomes',
  })
  @ApiQuery({
    name: 'beginDate',
    required: false,
    description: 'Başlangıç tarihi (ISO formatında)',
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Bitiş tarihi (ISO formatında)',
    type: String,
  })
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename=all-incomes.xlsx')
  exportAllIncomes(@Query() query: DateRangeDto, @CurrentCompany() companyId: string, @Res() res: Response) {
    const exportQuery = new ExportAllIncomesQuery(companyId);
    return this.exportAllIncomesHandler.execute(exportQuery, res);
  }

  @Get('export/summary')
  @ApiOperation({
    summary: 'Müşteri bazında gelir özetini Excel dosyası olarak dışa aktarır',
    operationId: 'exportIncomeSummary',
  })
  @ApiQuery({
    name: 'beginDate',
    required: false,
    description: 'Başlangıç tarihi (ISO formatında)',
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Bitiş tarihi (ISO formatında)',
    type: String,
  })
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename=income-summary.xlsx')
  exportIncomeSummary(@Query() query: DateRangeDto, @CurrentCompany() companyId: string, @Res() res: Response) {
    const exportQuery = new ExportMonthlyIncomeSummaryQuery(companyId, query);
    return this.exportMonthlyIncomeSummaryHandler.execute(exportQuery, res);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Belirli müşterinin gelirlerini listeler', operationId: 'getCustomerIncomes' })
  @ApiParam({ name: 'customerId', description: 'Müşteri ID' })
  @ApiSearchDatePaginatedQuery()
  @ApiPaginatedResponse(IncomeDto)
  getCustomerIncomes(
    @Param('customerId') customerId: string,
    @Query() query: PaginatedDateSearchDTO,
    @CurrentCompany() companyId: string
  ): Promise<PaginatedResponseDto<IncomeDto>> {
    const listQuery = new ListIncomesByCustomerQuery(customerId, companyId, query);
    return this.queryBus.execute(listQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Belirli bir gelir kaydını getirir', operationId: 'getIncomeById' })
  @ApiParam({ name: 'id', description: 'Gelir ID' })
  @ApiBaseResponse(IncomeDto)
  findOne(@Param('id') id: string, @CurrentCompany() companyId: string): Promise<IncomeDto> {
    const query = new GetIncomeQuery(id, companyId);
    return this.queryBus.execute(query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Gelir kaydını günceller', operationId: 'updateIncome' })
  @ApiParam({ name: 'id', description: 'Gelir ID' })
  @ApiCommandResponse()
  @ApiBody({ type: UpdateIncomeDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIncomeDto,
    @CurrentCompany() companyId: string
  ): Promise<CommandResponseDto> {
    const command = new UpdateIncomeCommand(id, dto, companyId);
    return this.commandBus.execute(command);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Gelir kaydını siler', operationId: 'deleteIncome' })
  @ApiParam({ name: 'id', description: 'Gelir ID' })
  @ApiCommandResponse()
  remove(@Param('id') id: string, @CurrentCompany() companyId: string): Promise<CommandResponseDto> {
    const command = new DeleteIncomeCommand(id, companyId);
    return this.commandBus.execute(command);
  }
}
