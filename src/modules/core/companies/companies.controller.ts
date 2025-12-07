import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ApiPaginatedResponse, ApiSearchPaginatedQuery } from '@common/decorator/swagger';
import { PaginatedSearchDTO } from '@common/dto/request/search.request.dto';
import { ErrorResponseDto } from '@common/dto/response/error.response.dto';
import { BaseResponseDto } from '@common/dto/response/base.response.dto';
import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { PaginatedResponseDto } from '@common/dto/response/paginated.response.dto';
import { CreateCompanyCommand } from './commands/create-company.command';
import { DeleteCompanyCommand } from './commands/delete-company.command';
import { UpdateCompanyCommand } from './commands/update-company.command';
import { CompanyDto } from './dto/company-dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { GetCompanyQuery } from './queries/get-company.query';
import { ListCompaniesQuery } from './queries/list-companies.query';

@ApiTags('Companies')
@ApiBearerAuth('Bearer')
@ApiExtraModels(
  BaseResponseDto,
  PaginatedResponseDto,
  CommandResponseDto,
  CompanyDto,
  CreateCompanyDto,
  UpdateCompanyDto,
  PaginatedSearchDTO
)
@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Tüm şirketleri getir',
    description: 'Sistemdeki tüm şirketleri sayfalı olarak listeler.',
    operationId: 'getAllCompanies',
  })
  @ApiSearchPaginatedQuery()
  @ApiPaginatedResponse(CompanyDto)
  @ApiOkResponse({
    type: PaginatedResponseDto,
    description: 'Şirketler başarıyla listelendi',
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz sorgu parametreleri',
    type: ErrorResponseDto,
  })
  async findAll(@Query() query: PaginatedSearchDTO): Promise<PaginatedResponseDto<CompanyDto>> {
    const listQuery = new ListCompaniesQuery(query.pageNumber, query.pageSize, query.search);
    return this.queryBus.execute(listQuery);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Yeni bir şirket oluştur',
    description: 'Sistemde yeni bir şirket kaydı oluşturur. Şirket adı benzersiz olmalıdır.',
    operationId: 'createCompany',
  })
  @ApiBody({
    type: CreateCompanyDto,
    description: 'Oluşturulacak şirket bilgileri',
    examples: {
      example1: {
        summary: 'Şirket oluştur',
        value: {
          name: 'Örnek Şirket A.Ş.',
          description: 'Muhasebe sistemi',
        },
      },
    },
  })
  @ApiCreatedResponse({
    type: CommandResponseDto,
    description: 'Şirket başarıyla oluşturuldu',
  })
  @ApiConflictResponse({
    description: 'Aynı isimde bir şirket zaten mevcut',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz şirket bilgileri',
    type: ErrorResponseDto,
  })
  async create(@Body() createCompanyDto: CreateCompanyDto): Promise<CommandResponseDto> {
    const command = new CreateCompanyCommand(createCompanyDto.name, createCompanyDto.description);
    return this.commandBus.execute(command);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'ID ile bir şirketi getir',
    description: "Belirtilen ID'ye sahip şirketi getirir.",
    operationId: 'getCompanyById',
  })
  @ApiParam({
    name: 'id',
    description: 'Şirket ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    type: BaseResponseDto,
    description: 'Şirket bulundu',
  })
  @ApiNotFoundResponse({
    description: 'Şirket bulunamadı',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz şirket ID',
    type: ErrorResponseDto,
  })
  async findOne(@Param('id') id: string): Promise<CompanyDto> {
    const query = new GetCompanyQuery(id);
    return this.queryBus.execute(query);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Şirket bilgilerini güncelle',
    description: "Belirtilen ID'ye sahip şirketin bilgilerini günceller.",
    operationId: 'updateCompany',
  })
  @ApiParam({
    name: 'id',
    description: 'Güncellenecek şirket ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    type: UpdateCompanyDto,
    description: 'Güncellenecek şirket bilgileri (kısmi güncelleme)',
    examples: {
      example1: {
        summary: 'Şirket adı güncelle',
        value: {
          name: 'Yeni Şirket Adı A.Ş.',
        },
      },
    },
  })
  @ApiOkResponse({
    type: CommandResponseDto,
    description: 'Şirket başarıyla güncellendi',
  })
  @ApiNotFoundResponse({
    description: 'Güncellenecek şirket bulunamadı',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz şirket ID veya güncelleme verisi',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Aynı isimde başka bir şirket zaten mevcut',
    type: ErrorResponseDto,
  })
  async update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto): Promise<CommandResponseDto> {
    const command = new UpdateCompanyCommand(id, updateCompanyDto.name, updateCompanyDto.description);
    return this.commandBus.execute(command);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Şirketi sil',
    description: "Belirtilen ID'ye sahip şirketi siler. Bu işlem geri alınamaz.",
    operationId: 'deleteCompany',
  })
  @ApiParam({
    name: 'id',
    description: 'Silinecek şirket ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    type: CommandResponseDto,
    description: 'Şirket başarıyla silindi',
  })
  @ApiNotFoundResponse({
    description: 'Silinecek şirket bulunamadı',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz şirket ID',
    type: ErrorResponseDto,
  })
  async remove(@Param('id') id: string): Promise<CommandResponseDto> {
    const command = new DeleteCompanyCommand(id);
    return this.commandBus.execute(command);
  }
}
