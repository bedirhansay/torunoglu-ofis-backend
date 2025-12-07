import { Controller, Get, HttpStatus, Param, Query, Res, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

import { CurrentCompany } from '@common/decorator/company.id';
import { DateRangeDTO } from '@common/dto/request';
import { CompanyGuard } from '@common/guards/company.id';
import { CustomerIncomeSummaryDto } from './dto/customer-report.dto';
import { DashboardStatsDto, DetailedReportDto, MonthlyReportItemDto } from './dto/total-summary-dto';
import { ExportFinancialSummaryQuery } from './queries/export-financial-summary.query';
import { GetCustomerIncomeSummaryQuery } from './queries/get-customer-income-summary.query';
import { GetDashboardStatsQuery } from './queries/get-dashboard-stats.query';
import { GetDetailedSummaryQuery } from './queries/get-detailed-summary.query';
import { GetMonthlySummaryQuery } from './queries/get-monthly-summary.query';
import { ExportFinancialSummaryHandler } from './queries/handlers/export-financial-summary.handler';

@ApiTags('Reports')
@ApiBearerAuth('Bearer')
@ApiSecurity('x-company-id')
@ApiExtraModels(MonthlyReportItemDto, CustomerIncomeSummaryDto, DashboardStatsDto, DetailedReportDto, DateRangeDTO)
@UseGuards(CompanyGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly exportFinancialSummaryHandler: ExportFinancialSummaryHandler
  ) {}

  @Get('dashboard-stats')
  @ApiOperation({
    summary: 'Dashboard istatistikleri',
    description: 'Genel dashboard için özet istatistikler (toplam gelir, gider, müşteri sayısı, vs.)',
    operationId: 'getDashboardStats',
  })
  @ApiOkResponse({
    type: DashboardStatsDto,
    description: 'Dashboard istatistikleri başarıyla getirildi',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Geçersiz parametreler',
  })
  async getDashboardStats(@CurrentCompany() companyId: string): Promise<DashboardStatsDto> {
    const query = new GetDashboardStatsQuery(companyId);
    return this.queryBus.execute(query);
  }

  @Get('monthly-summary')
  @ApiOperation({
    summary: 'Yıla göre aylık yakıt, gelir ve gider raporlarını listeler',
    description: 'Belirtilen yıl için her ayın gelir, gider ve yakıt toplamlarını içeren özet rapor',
    operationId: 'getMonthlySummary',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Raporlanacak yıl (varsayılan: mevcut yıl)',
    example: 2024,
    type: Number,
  })
  @ApiOkResponse({
    type: MonthlyReportItemDto,
    isArray: true,
    description: 'Aylık özet rapor başarıyla getirildi',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Geçersiz yıl parametresi',
  })
  async getMonthlySummary(
    @CurrentCompany() companyId: string,
    @Query('year') year?: number
  ): Promise<MonthlyReportItemDto[]> {
    const query = new GetMonthlySummaryQuery(companyId, year);
    return this.queryBus.execute(query);
  }

  @Get('detailed-summary')
  @ApiOperation({
    summary: 'Detaylı finansal rapor',
    description: 'Belirtilen tarih aralığı için detaylı gelir, gider ve kâr analizi',
    operationId: 'getDetailedSummary',
  })
  @ApiQuery({
    name: 'beginDate',
    required: false,
    description: 'Başlangıç tarihi (YYYY-MM-DD)',
    example: '2024-01-01',
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Bitiş tarihi (YYYY-MM-DD)',
    example: '2024-12-31',
    type: String,
  })
  @ApiOkResponse({
    type: DetailedReportDto,
    description: 'Detaylı rapor başarıyla getirildi',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Geçersiz tarih parametreleri',
  })
  async getDetailedSummary(
    @Query() dateRange: DateRangeDTO,
    @CurrentCompany() companyId: string
  ): Promise<DetailedReportDto> {
    const query = new GetDetailedSummaryQuery(companyId, dateRange);
    return this.queryBus.execute(query);
  }

  @Get('export-financial-summary')
  @ApiOperation({
    summary: 'Finansal özet raporunu Excel olarak dışa aktar',
    description: 'Belirtilen tarih aralığı için finansal özet raporunu Excel dosyası olarak dışa aktarır',
    operationId: 'exportFinancialSummary',
  })
  @ApiQuery({
    name: 'beginDate',
    required: false,
    description: 'Başlangıç tarihi (YYYY-MM-DD)',
    example: '2024-01-01',
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Bitiş tarihi (YYYY-MM-DD)',
    example: '2024-12-31',
    type: String,
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
        schema: { type: 'string', example: 'attachment; filename="financial_summary.xlsx"' },
      },
    },
  })
  async exportFinancialSummary(
    @Query() dateRange: DateRangeDTO,
    @CurrentCompany() companyId: string,
    @Res() res: Response
  ): Promise<void> {
    const exportQuery = new ExportFinancialSummaryQuery(companyId, dateRange);
    return this.exportFinancialSummaryHandler.execute(exportQuery, res);
  }

  @Get('customer-income-summary/:customerId')
  @ApiOperation({
    summary: 'Bir müşteriye ait toplam faturalandırma, ödeme ve alacak bilgisini döner',
    description: 'Belirtilen müşteri için detaylı gelir özeti (toplam fatura, ödeme, kalan alacak)',
    operationId: 'getCustomerIncomeSummary',
  })
  @ApiParam({
    name: 'customerId',
    description: 'Müşteri ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    type: CustomerIncomeSummaryDto,
    description: 'Müşteri gelir özeti başarıyla getirildi',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Müşteri bulunamadı',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Geçersiz müşteri ID',
  })
  async getCustomerIncomeSummary(
    @Param('customerId') customerId: string,
    @CurrentCompany() companyId: string
  ): Promise<CustomerIncomeSummaryDto> {
    const query = new GetCustomerIncomeSummaryQuery(customerId, companyId);
    return this.queryBus.execute(query);
  }
}
