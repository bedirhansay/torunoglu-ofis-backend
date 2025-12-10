import {
  Body,
  Controller,
  Delete,
  Get,
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
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

import { CurrentCompany } from '../../../common/decorator/company.id';
import {
  ApiCommandResponse,
  ApiPaginatedResponse,
  ApiSearchDatePaginatedQuery,
} from '../../../common/decorator/swagger';
import { CompanyGuard } from '../../../common/guards/company.id';
import { DateRangeDTO, PaginatedDateSearchDTO } from '../../../common/types/request';
import { PaginatedSearchDTO } from '../../../common/types/request/search.request.dto';
import { BaseResponseDto } from '../../../common/types/response/base.response.dto';
import { CommandResponseDto } from '../../../common/types/response/command-response.dto';
import { ErrorResponseDto } from '../../../common/types/response/error.response.dto';
import { PaginatedResponseDto } from '../../../common/types/response/paginated.response.dto';
import { CreateFuelCommand } from './commands/create-fuel.command';
import { DeleteFuelCommand } from './commands/delete-fuel.command';
import { UpdateFuelCommand } from './commands/update-fuel.command';
import { CreateFuelDto } from './dto/create-fuel.dto';
import { FuelDto } from './dto/fuel.dto';
import { UpdateFuelDto } from './dto/update-fuel.dto';
import { ExportFuelsQuery } from './queries/export-fuels.query';
import { ExportMonthlyFuelSummaryQuery } from './queries/export-monthly-fuel-summary.query';
import { GetFuelQuery } from './queries/get-fuel.query';
import { ExportFuelsHandler } from './queries/handlers/export-fuels.handler';
import { ExportMonthlyFuelSummaryHandler } from './queries/handlers/export-monthly-fuel-summary.handler';
import { ListFuelsByVehicleQuery } from './queries/list-fuels-by-vehicle.query';
import { ListFuelsQuery } from './queries/list-fuels.query';

@ApiTags('Fuels')
@ApiBearerAuth('Bearer')
@ApiSecurity('x-company-id')
@ApiExtraModels(
  FuelDto,
  CreateFuelDto,
  UpdateFuelDto,
  PaginatedSearchDTO,
  PaginatedResponseDto,
  BaseResponseDto,
  CommandResponseDto
)
@UseGuards(CompanyGuard)
@Controller('fuels')
export class FuelController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly exportFuelsHandler: ExportFuelsHandler,
    private readonly exportMonthlyFuelSummaryHandler: ExportMonthlyFuelSummaryHandler
  ) {}

  @Get('export')
  @ApiOperation({
    summary: 'Yakıt kayıtlarını Excel olarak dışa aktar',
    description: 'Şirkete ait yakıt kayıtlarını Excel dosyası olarak dışa aktarır',
    operationId: 'exportFuels',
  })
  @ApiOkResponse({
    description: 'Excel dosyası başarıyla oluşturuldu',
    headers: {
      'Content-Type': {
        description: 'MIME tipi',
        schema: { type: 'string', example: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      },
      'Content-Disposition': {
        description: 'Dosya adı',
        schema: { type: 'string', example: 'attachment; filename="fuels_export.xlsx"' },
      },
    },
  })
  async exportToExcel(@CurrentCompany() companyId: string, @Query() query: PaginatedSearchDTO, @Res() res: Response) {
    const exportQuery = new ExportFuelsQuery(companyId, query);
    return this.exportFuelsHandler.execute(exportQuery, res);
  }

  @Get('export-monthly-fuel-summary-excel')
  @ApiOperation({
    summary: 'Araç yakıt verilerini Excel olarak dışa aktarır',
    description: 'Belirtilen tarih aralığında araçlara göre yakıt özetini Excel dosyası olarak dışa aktarır',
    operationId: 'exportMonthlyFuelSummaryExcel',
  })
  @ApiOkResponse({
    description: 'Excel dosyası başarıyla oluşturuldu',
    headers: {
      'Content-Type': {
        description: 'MIME tipi',
        schema: { type: 'string', example: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      },
      'Content-Disposition': {
        description: 'Dosya adı',
        schema: { type: 'string', example: 'attachment; filename="vehicle-fuel-summary.xlsx"' },
      },
    },
  })
  async exportMonthlyFuelSummary(
    @Query() query: DateRangeDTO,
    @CurrentCompany() companyId: string,
    @Res() res: Response
  ) {
    const exportQuery = new ExportMonthlyFuelSummaryQuery(companyId, query);
    return this.exportMonthlyFuelSummaryHandler.execute(exportQuery, res);
  }

  @Get()
  @ApiOperation({
    summary: 'Yakıt kayıtlarını sayfalı şekilde listele',
    description:
      'Şirkete ait tüm yakıt kayıtlarını sayfalı olarak listeler. İsteğe bağlı arama ve tarih filtreleme desteği.',
    operationId: 'getAllFuels',
  })
  @ApiSearchDatePaginatedQuery()
  @ApiPaginatedResponse(FuelDto)
  @ApiBadRequestResponse({
    description: 'Geçersiz sorgu parametreleri',
    type: ErrorResponseDto,
  })
  async findAll(
    @Query() query: PaginatedDateSearchDTO,
    @CurrentCompany() companyId: string
  ): Promise<PaginatedResponseDto<FuelDto>> {
    const listQuery = new ListFuelsQuery(companyId, query);
    return this.queryBus.execute(listQuery);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Yeni yakıt kaydı oluştur',
    description: 'Şirkete ait yeni bir yakıt kaydı oluşturur',
    operationId: 'createFuel',
  })
  @ApiBody({
    type: CreateFuelDto,
    description: 'Oluşturulacak yakıt kaydı bilgileri',
    examples: {
      example1: {
        summary: 'Yakıt kaydı oluştur',
        value: {
          vehicleId: '665b77abc123456789abcdef',
          totalPrice: 500,
          invoiceNo: 'FAT-2025-001',
          operationDate: '2025-01-15T10:00:00.000Z',
          driverName: 'Mehmet Yılmaz',
          description: 'Düzenli yakıt alımı',
        },
      },
    },
  })
  @ApiCommandResponse()
  @ApiBadRequestResponse({
    description: 'Geçersiz yakıt kaydı bilgileri',
    type: ErrorResponseDto,
  })
  async create(@Body() createFuelDto: CreateFuelDto, @CurrentCompany() companyId: string): Promise<CommandResponseDto> {
    const command = new CreateFuelCommand(createFuelDto, companyId);
    return this.commandBus.execute(command);
  }

  @Get('vehicle/:id')
  @ApiOperation({
    summary: 'Araca ait yakıt işlemleri',
    description: "Belirtilen araç ID'sine ait yakıt kayıtlarını getirir",
    operationId: 'getFuelsByVehicle',
  })
  @ApiParam({
    name: 'id',
    description: 'Araç ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiSearchDatePaginatedQuery()
  @ApiPaginatedResponse(FuelDto)
  @ApiNotFoundResponse({
    description: 'Araç bulunamadı',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz araç ID',
    type: ErrorResponseDto,
  })
  async getFuelsByVehicle(
    @Param('id') id: string,
    @Query() query: PaginatedSearchDTO,
    @CurrentCompany() companyId: string
  ): Promise<PaginatedResponseDto<FuelDto>> {
    const listQuery = new ListFuelsByVehicleQuery(id, companyId, query);
    return this.queryBus.execute(listQuery);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'ID ile yakıt kaydı getir',
    description: "Belirtilen ID'ye sahip yakıt kaydını getirir",
    operationId: 'getFuelById',
  })
  @ApiParam({
    name: 'id',
    description: 'Yakıt ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    type: FuelDto,
    description: 'Yakıt kaydı başarıyla getirildi',
  })
  @ApiNotFoundResponse({
    description: 'Yakıt kaydı bulunamadı',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz yakıt ID',
    type: ErrorResponseDto,
  })
  async findOne(@Param('id') id: string, @CurrentCompany() companyId: string): Promise<FuelDto> {
    const query = new GetFuelQuery(id, companyId);
    return this.queryBus.execute(query);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Yakıt kaydını güncelle',
    description: "Belirtilen ID'ye sahip yakıt kaydının bilgilerini günceller",
    operationId: 'updateFuel',
  })
  @ApiParam({
    name: 'id',
    description: 'Güncellenecek yakıt ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    type: UpdateFuelDto,
    description: 'Güncellenecek yakıt bilgileri (kısmi güncelleme)',
    examples: {
      example1: {
        summary: 'Toplam fiyat güncelle',
        value: {
          totalPrice: 600,
        },
      },
    },
  })
  @ApiCommandResponse()
  @ApiNotFoundResponse({
    description: 'Güncellenecek yakıt kaydı bulunamadı',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz yakıt ID veya güncelleme verisi',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateFuelDto: UpdateFuelDto,
    @CurrentCompany() companyId: string
  ): Promise<CommandResponseDto> {
    const command = new UpdateFuelCommand(id, updateFuelDto, companyId);
    return this.commandBus.execute(command);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Yakıt kaydını sil',
    description: "Belirtilen ID'ye sahip yakıt kaydını siler. Bu işlem geri alınamaz.",
    operationId: 'deleteFuel',
  })
  @ApiParam({
    name: 'id',
    description: 'Silinecek yakıt ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiCommandResponse()
  @ApiNotFoundResponse({
    description: 'Silinecek yakıt kaydı bulunamadı',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz yakıt ID',
    type: ErrorResponseDto,
  })
  async remove(@Param('id') id: string, @CurrentCompany() companyId: string): Promise<CommandResponseDto> {
    const command = new DeleteFuelCommand(id, companyId);
    return this.commandBus.execute(command);
  }
}
