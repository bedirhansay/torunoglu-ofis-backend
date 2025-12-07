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
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentCompany } from '@common/decorator/company.id';
import { ApiCommandResponse, ApiPaginatedResponse, ApiSearchDatePaginatedQuery } from '@common/decorator/swagger';
import { PaginatedDateSearchDTO } from '@common/dto/request/pagination.request.dto';
import { BaseResponseDto } from '@common/dto/response/base.response.dto';
import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { PaginatedResponseDto } from '@common/dto/response/paginated.response.dto';
import { CompanyGuard } from '@common/guards/company.id';

import { CreateCustomerCommand } from './commands/create-customer.command';
import { DeleteCustomerCommand } from './commands/delete-customer.command';
import { UpdateCustomerCommand } from './commands/update-customer.command';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerDto } from './dto/customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { GetCustomerQuery } from './queries/get-customer.query';
import { ListCustomersQuery } from './queries/list-customers.query';

@ApiTags('Customers')
@ApiBearerAuth('Bearer')
@ApiSecurity('x-company-id')
@ApiExtraModels(
  BaseResponseDto,
  PaginatedResponseDto,
  CommandResponseDto,
  CustomerDto,
  PaginatedDateSearchDTO,
  CreateCustomerDto,
  UpdateCustomerDto
)
@UseGuards(CompanyGuard)
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Tüm müşterileri listele',
    description: 'Şirkete ait tüm müşterileri sayfalı olarak listeler. İsteğe bağlı arama ve tarih filtreleme desteği.',
    operationId: 'getAllCustomers',
  })
  @ApiSearchDatePaginatedQuery()
  @ApiPaginatedResponse(CustomerDto)
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Geçersiz sorgu parametreleri',
  })
  async findAll(
    @Query() query: PaginatedDateSearchDTO,
    @CurrentCompany() companyId: string
  ): Promise<PaginatedResponseDto<CustomerDto>> {
    const listQuery = new ListCustomersQuery(
      companyId,
      query.pageNumber,
      query.pageSize,
      query.search,
      query.beginDate,
      query.endDate
    );
    return this.queryBus.execute(listQuery);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Yeni müşteri oluştur',
    description: 'Şirkete ait yeni bir müşteri kaydı oluşturur. Müşteri adı şirket içinde benzersiz olmalıdır.',
    operationId: 'createCustomer',
  })
  @ApiBody({
    type: CreateCustomerDto,
    description: 'Oluşturulacak müşteri bilgileri',
  })
  @ApiCommandResponse()
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Bu isimde bir müşteri zaten mevcut',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Geçersiz müşteri bilgileri',
  })
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
    @CurrentCompany() companyId: string
  ): Promise<CommandResponseDto> {
    const command = new CreateCustomerCommand(
      createCustomerDto.name,
      companyId,
      createCustomerDto.description,
      createCustomerDto.phone
    );
    return this.commandBus.execute(command);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Müşteri detayı getir',
    description: "Belirtilen ID'ye sahip müşteriyi getirir.",
    operationId: 'getCustomerById',
  })
  @ApiParam({
    name: 'id',
    description: 'Müşteri ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    type: CustomerDto,
    description: 'Müşteri başarıyla getirildi',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Müşteri bulunamadı',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Geçersiz müşteri ID',
  })
  async findOne(@Param('id') id: string, @CurrentCompany() companyId: string): Promise<CustomerDto> {
    const query = new GetCustomerQuery(id, companyId);
    return this.queryBus.execute(query);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Müşteri bilgilerini güncelle',
    description: "Belirtilen ID'ye sahip müşterinin bilgilerini günceller.",
    operationId: 'updateCustomer',
  })
  @ApiParam({
    name: 'id',
    description: 'Güncellenecek müşteri ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    type: UpdateCustomerDto,
    description: 'Güncellenecek müşteri bilgileri (kısmi güncelleme)',
  })
  @ApiCommandResponse()
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Güncellenecek müşteri bulunamadı',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Geçersiz müşteri ID veya güncelleme verisi',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Aynı isimde başka bir müşteri zaten mevcut',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @CurrentCompany() companyId: string
  ): Promise<CommandResponseDto> {
    const command = new UpdateCustomerCommand(
      id,
      companyId,
      updateCustomerDto.name,
      updateCustomerDto.description,
      updateCustomerDto.phone
    );
    return this.commandBus.execute(command);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Müşteriyi sil',
    description: "Belirtilen ID'ye sahip müşteriyi siler. Bu işlem geri alınamaz.",
    operationId: 'deleteCustomer',
  })
  @ApiParam({
    name: 'id',
    description: 'Silinecek müşteri ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiCommandResponse()
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Silinecek müşteri bulunamadı',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Geçersiz müşteri ID',
  })
  async remove(@Param('id') id: string, @CurrentCompany() companyId: string): Promise<CommandResponseDto> {
    const command = new DeleteCustomerCommand(id, companyId);
    return this.commandBus.execute(command);
  }
}
