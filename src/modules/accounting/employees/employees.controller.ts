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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentCompany } from '../../../common/decorator/company.id';
import { ApiCommandResponse, ApiPaginatedResponse, ApiSearchPaginatedQuery } from '../../../common/decorator/swagger';
import { CompanyGuard } from '../../../common/guards/company.id';
import { PaginatedSearchDTO } from '../../../common/types/request/search.request.dto';
import { BaseResponseDto } from '../../../common/types/response/base.response.dto';
import { CommandResponseDto } from '../../../common/types/response/command-response.dto';
import { ErrorResponseDto } from '../../../common/types/response/error.response.dto';
import { PaginatedResponseDto } from '../../../common/types/response/paginated.response.dto';

import { CreateEmployeeCommand } from './commands/create-employee.command';
import { DeleteEmployeeCommand } from './commands/delete-employee.command';
import { UpdateEmployeeCommand } from './commands/update-employee.command';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeDto } from './dto/employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { GetEmployeeQuery } from './queries/get-employee.query';
import { ListEmployeesQuery } from './queries/list-employees.query';

@ApiTags('Employees')
@ApiBearerAuth('Bearer')
@ApiSecurity('x-company-id')
@ApiExtraModels(
  BaseResponseDto,
  PaginatedResponseDto,
  CommandResponseDto,
  EmployeeDto,
  PaginatedSearchDTO,
  CreateEmployeeDto,
  UpdateEmployeeDto
)
@UseGuards(CompanyGuard)
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Tüm çalışanları listele',
    description: 'Şirkete ait tüm çalışanları sayfalı olarak listeler. İsteğe bağlı arama desteği.',
    operationId: 'getAllEmployees',
  })
  @ApiSearchPaginatedQuery()
  @ApiPaginatedResponse(EmployeeDto)
  @ApiBadRequestResponse({
    description: 'Geçersiz sorgu parametreleri',
    type: ErrorResponseDto,
  })
  async findAll(
    @Query() query: PaginatedSearchDTO,
    @CurrentCompany() companyId: string
  ): Promise<PaginatedResponseDto<EmployeeDto>> {
    const listQuery = new ListEmployeesQuery(companyId, query);
    return this.queryBus.execute(listQuery);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Yeni çalışan oluştur',
    description: 'Şirkete ait yeni bir çalışan kaydı oluşturur. Çalışan adı şirket içinde benzersiz olmalıdır.',
    operationId: 'createEmployee',
  })
  @ApiBody({
    type: CreateEmployeeDto,
    description: 'Oluşturulacak çalışan bilgileri',
    examples: {
      example1: {
        summary: 'Çalışan oluştur',
        value: {
          fullName: 'Mehmet Yılmaz',
          departmentName: 'Muhasebe',
          phone: '+90 532 123 45 67',
          hireDate: '2024-01-01',
          salary: 15000,
          isActive: true,
        },
      },
    },
  })
  @ApiCommandResponse()
  @ApiConflictResponse({
    description: 'Bu isimde bir çalışan zaten mevcut',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz çalışan bilgileri',
    type: ErrorResponseDto,
  })
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @CurrentCompany() companyId: string
  ): Promise<CommandResponseDto> {
    const command = new CreateEmployeeCommand(createEmployeeDto, companyId);
    return this.commandBus.execute(command);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Çalışan detayı getir',
    description: "Belirtilen ID'ye sahip çalışanı getirir.",
    operationId: 'getEmployeeById',
  })
  @ApiParam({
    name: 'id',
    description: 'Çalışan ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    type: EmployeeDto,
    description: 'Çalışan başarıyla getirildi',
  })
  @ApiNotFoundResponse({
    description: 'Çalışan bulunamadı',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz çalışan ID',
    type: ErrorResponseDto,
  })
  async findOne(@Param('id') id: string, @CurrentCompany() companyId: string): Promise<EmployeeDto> {
    const query = new GetEmployeeQuery(id, companyId);
    return this.queryBus.execute(query);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Çalışan bilgilerini güncelle',
    description: "Belirtilen ID'ye sahip çalışanın bilgilerini günceller.",
    operationId: 'updateEmployee',
  })
  @ApiParam({
    name: 'id',
    description: 'Güncellenecek çalışan ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    type: UpdateEmployeeDto,
    description: 'Güncellenecek çalışan bilgileri (kısmi güncelleme)',
    examples: {
      example1: {
        summary: 'Maaş güncelle',
        value: {
          salary: 18000,
        },
      },
    },
  })
  @ApiCommandResponse()
  @ApiNotFoundResponse({
    description: 'Güncellenecek çalışan bulunamadı',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz çalışan ID veya güncelleme verisi',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Aynı isimde başka bir çalışan zaten mevcut',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @CurrentCompany() companyId: string
  ): Promise<CommandResponseDto> {
    const command = new UpdateEmployeeCommand(id, updateEmployeeDto, companyId);
    return this.commandBus.execute(command);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Çalışanı sil',
    description: "Belirtilen ID'ye sahip çalışanı siler. Bu işlem geri alınamaz.",
    operationId: 'deleteEmployee',
  })
  @ApiParam({
    name: 'id',
    description: 'Silinecek çalışan ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiCommandResponse()
  @ApiNotFoundResponse({
    description: 'Silinecek çalışan bulunamadı',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz çalışan ID',
    type: ErrorResponseDto,
  })
  async remove(@Param('id') id: string, @CurrentCompany() companyId: string): Promise<CommandResponseDto> {
    const command = new DeleteEmployeeCommand(id, companyId);
    return this.commandBus.execute(command);
  }
}
