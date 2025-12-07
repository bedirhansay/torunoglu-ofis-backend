import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

import { CurrentCompany } from '@common/decorator/company.id';
import { ApiCommandResponse, ApiPaginatedResponse, ApiSearchDatePaginatedQuery } from '@common/decorator/swagger';
import { DateRangeDTO, PaginatedDateSearchDTO } from '@common/dto/request';
import { PaginatedSearchDTO } from '@common/dto/request/search.request.dto';
import { BaseResponseDto } from '@common/dto/response/base.response.dto';
import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { ErrorResponseDto } from '@common/dto/response/error.response.dto';
import { PaginatedResponseDto } from '@common/dto/response/paginated.response.dto';
import { CompanyGuard } from '@common/guards/company.id';

import { CreateExpenseCommand } from './commands/create-expense.command';
import { DeleteExpenseCommand } from './commands/delete-expense.command';
import { UpdateExpenseCommand } from './commands/update-expense.command';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseDto } from './dto/expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExportExpensesQuery } from './queries/export-expenses.query';
import { GetExpenseQuery } from './queries/get-expense.query';
import { ExportExpensesHandler } from './queries/handlers/export-expenses.handler';
import { ListExpensesByEmployeeQuery } from './queries/list-expenses-by-employee.query';
import { ListExpensesByVehicleQuery } from './queries/list-expenses-by-vehicle.query';
import { ListExpensesQuery } from './queries/list-expenses.query';

@ApiTags('Expenses')
@ApiBearerAuth('Bearer')
@ApiSecurity('x-company-id')
@ApiExtraModels(
  BaseResponseDto,
  PaginatedResponseDto,
  ExpenseDto,
  PaginatedSearchDTO,
  CreateExpenseDto,
  UpdateExpenseDto,
  CommandResponseDto
)
@UseGuards(CompanyGuard)
@Controller('expense')
export class ExpenseController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly exportExpensesHandler: ExportExpensesHandler
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Tüm giderleri listele',
    description: 'Şirkete ait tüm giderleri sayfalı olarak listeler. İsteğe bağlı arama ve tarih filtreleme desteği.',
    operationId: 'getAllExpenses',
  })
  @ApiSearchDatePaginatedQuery()
  @ApiPaginatedResponse(ExpenseDto)
  @ApiBadRequestResponse({
    description: 'Geçersiz sorgu parametreleri',
    type: ErrorResponseDto,
  })
  async findAll(
    @Query() query: PaginatedDateSearchDTO,
    @CurrentCompany() companyId: string
  ): Promise<PaginatedResponseDto<ExpenseDto>> {
    const listQuery = new ListExpensesQuery(companyId, query);
    return this.queryBus.execute(listQuery);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Yeni gider oluştur',
    description: 'Şirkete ait yeni bir gider kaydı oluşturur.',
    operationId: 'createExpense',
  })
  @ApiBody({
    type: CreateExpenseDto,
    description: 'Oluşturulacak gider bilgileri',
    examples: {
      example1: {
        summary: 'Araç gideri',
        value: {
          amount: 500,
          description: 'Yakıt gideri',
          categoryId: '665b77abc123456789abcdef',
          operationDate: '2025-01-15T10:00:00.000Z',
          relatedModel: 'Vehicle',
          relatedToId: '665b77abc123456789abcdef',
        },
      },
    },
  })
  @ApiCommandResponse()
  @ApiBadRequestResponse({
    description: 'Geçersiz gider bilgileri',
    type: ErrorResponseDto,
  })
  async create(
    @Body() createExpenseDto: CreateExpenseDto,
    @CurrentCompany() companyId: string
  ): Promise<CommandResponseDto> {
    const command = new CreateExpenseCommand(createExpenseDto, companyId);
    return this.commandBus.execute(command);
  }

  @Get('export-grouped-fuel-excel')
  @ApiOperation({
    summary: 'Gider verilerini Excel olarak dışa aktarır',
    description: 'Belirtilen tarih aralığındaki gider verilerini Excel formatında dışa aktarır.',
    operationId: 'exportGroupedExpense',
  })
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Excel dosyası başarıyla oluşturuldu',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async exportExpenses(@Query() query: DateRangeDTO, @CurrentCompany() companyId: string, @Res() res: Response) {
    const exportQuery = new ExportExpensesQuery(companyId, query);
    return this.exportExpensesHandler.execute(exportQuery, res);
  }

  @Get('vehicle/:vehicleId')
  @ApiOperation({
    summary: 'Araca ait giderler',
    description: 'Belirtilen araca ait giderleri listeler.',
    operationId: 'getExpensesByVehicle',
  })
  @ApiParam({
    name: 'vehicleId',
    description: 'Araç ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiSearchDatePaginatedQuery()
  @ApiPaginatedResponse(ExpenseDto)
  @ApiNotFoundResponse({
    description: 'Araç bulunamadı',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz araç ID',
    type: ErrorResponseDto,
  })
  async getExpensesByVehicle(
    @Param('vehicleId') vehicleId: string,
    @Query() query: PaginatedSearchDTO,
    @CurrentCompany() companyId: string
  ): Promise<PaginatedResponseDto<ExpenseDto>> {
    const listQuery = new ListExpensesByVehicleQuery(vehicleId, companyId, query);
    return this.queryBus.execute(listQuery);
  }

  @Get('employee/:employeeId')
  @ApiOperation({
    summary: 'Personele ait giderler',
    description: 'Belirtilen personele ait giderleri listeler.',
    operationId: 'getExpensesByEmployee',
  })
  @ApiParam({
    name: 'employeeId',
    description: 'Personel ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiSearchDatePaginatedQuery()
  @ApiPaginatedResponse(ExpenseDto)
  @ApiNotFoundResponse({
    description: 'Personel bulunamadı',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz personel ID',
    type: ErrorResponseDto,
  })
  async getExpensesByEmployee(
    @Param('employeeId') employeeId: string,
    @Query() query: PaginatedSearchDTO,
    @CurrentCompany() companyId: string
  ): Promise<PaginatedResponseDto<ExpenseDto>> {
    const listQuery = new ListExpensesByEmployeeQuery(employeeId, companyId, query);
    return this.queryBus.execute(listQuery);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Gider detayı getir',
    description: "Belirtilen ID'ye sahip gideri getirir.",
    operationId: 'getExpenseById',
  })
  @ApiParam({
    name: 'id',
    description: 'Gider ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    type: ExpenseDto,
    description: 'Gider başarıyla getirildi',
  })
  @ApiNotFoundResponse({
    description: 'Gider bulunamadı',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz gider ID',
    type: ErrorResponseDto,
  })
  async findOne(@Param('id') id: string, @CurrentCompany() companyId: string): Promise<ExpenseDto> {
    const query = new GetExpenseQuery(id, companyId);
    return this.queryBus.execute(query);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Gider bilgilerini güncelle',
    description: "Belirtilen ID'ye sahip giderin bilgilerini günceller.",
    operationId: 'updateExpense',
  })
  @ApiParam({
    name: 'id',
    description: 'Güncellenecek gider ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    type: UpdateExpenseDto,
    description: 'Güncellenecek gider bilgileri (kısmi güncelleme)',
    examples: {
      example1: {
        summary: 'Tutar güncelle',
        value: {
          amount: 750,
        },
      },
    },
  })
  @ApiCommandResponse()
  @ApiNotFoundResponse({
    description: 'Güncellenecek gider bulunamadı',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz gider ID veya güncelleme verisi',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @CurrentCompany() companyId: string
  ): Promise<CommandResponseDto> {
    const command = new UpdateExpenseCommand(id, updateExpenseDto, companyId);
    return this.commandBus.execute(command);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Gideri sil',
    description: "Belirtilen ID'ye sahip gideri siler. Bu işlem geri alınamaz.",
    operationId: 'deleteExpense',
  })
  @ApiParam({
    name: 'id',
    description: 'Silinecek gider ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiCommandResponse()
  @ApiNotFoundResponse({
    description: 'Silinecek gider bulunamadı',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz gider ID',
    type: ErrorResponseDto,
  })
  async remove(@Param('id') id: string, @CurrentCompany() companyId: string): Promise<CommandResponseDto> {
    const command = new DeleteExpenseCommand(id, companyId);
    return this.commandBus.execute(command);
  }
}
