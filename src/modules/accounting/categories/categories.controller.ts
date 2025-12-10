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
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentCompany } from '../../../common/decorator/company.id';
import {
  ApiBaseResponse,
  ApiCommandResponse,
  ApiPaginatedResponse,
  ApiSearchPaginatedQuery,
  } from '../../../common/decorator/swagger';
import { PaginatedSearchDTO } from '../../../common/dto/request/search.request.dto';
import { BaseResponseDto } from '../../../common/dto/response/base.response.dto';
import { CommandResponseDto } from '../../../common/dto/response/command-response.dto';
import { ErrorResponseDto } from '../../../common/dto/response/error.response.dto';
import { PaginatedResponseDto } from '../../../common/dto/response/paginated.response.dto';
import { CompanyGuard } from '../../../common/guards/company.id';

import { CreateCategoryCommand } from './commands/create-category.command';
import { DeleteCategoryCommand } from './commands/delete-category.command';
import { UpdateCategoryCommand } from './commands/update-category.command';
import { CategoryDto } from './dto/category.dto';
import { CreateCategoryCommandDto } from './dto/create-category.dto';
import { UpdateCategoryCommandDto } from './dto/update-category.dto';
import { GetCategoryQuery } from './queries/get-category.query';
import { ListCategoriesQuery } from './queries/list-categories.query';

@ApiTags('Categories')
@ApiExtraModels(
  CommandResponseDto,
  CategoryDto,
  CreateCategoryCommandDto,
  UpdateCategoryCommandDto,
  PaginatedSearchDTO,
  BaseResponseDto,
  PaginatedResponseDto
)
@ApiBearerAuth('Bearer')
@ApiSecurity('x-company-id')
@UseGuards(CompanyGuard)
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Tüm kategorileri listele',
    description: 'Şirkete ait tüm kategorileri sayfalı olarak listeler. İsteğe bağlı arama desteği.',
    operationId: 'getAllCategories',
  })
  @ApiSearchPaginatedQuery()
  @ApiPaginatedResponse(CategoryDto)
  @ApiBadRequestResponse({
    description: 'Geçersiz sorgu parametreleri',
    type: ErrorResponseDto,
  })
  async findAll(
    @Query() query: PaginatedSearchDTO,
    @CurrentCompany() companyId: string
  ): Promise<PaginatedResponseDto<CategoryDto>> {
    const listQuery = new ListCategoriesQuery(companyId, query.pageNumber, query.pageSize, query.search);
    return this.queryBus.execute(listQuery);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Yeni bir kategori oluşturur',
    description: 'Şirkete ait yeni bir kategori oluşturur. Kategori adı benzersiz olmalıdır.',
    operationId: 'createCategory',
  })
  @ApiBody({
    type: CreateCategoryCommandDto,
    description: 'Oluşturulacak kategori bilgileri',
    examples: {
      example1: {
        summary: 'Gider kategorisi',
        value: {
          name: 'Ulaşım',
          type: 'expense',
          description: 'Ulaşım giderleri',
          isActive: true,
        },
      },
    },
  })
  @ApiCommandResponse()
  @ApiConflictResponse({
    description: 'Bu isimde bir kategori zaten mevcut',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz kategori tipi veya bilgiler',
    type: ErrorResponseDto,
  })
  async create(
    @Body() createCategoryDto: CreateCategoryCommandDto,
    @CurrentCompany() companyId: string
  ): Promise<CommandResponseDto> {
    const command = new CreateCategoryCommand(createCategoryDto, companyId);
    return this.commandBus.execute(command);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'ID ile kategori getir',
    description: "Belirtilen ID'ye sahip kategoriyi getirir.",
    operationId: 'getCategoryById',
  })
  @ApiParam({
    name: 'id',
    description: 'Kategori ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBaseResponse(CategoryDto)
  @ApiNotFoundResponse({
    description: 'Kategori bulunamadı',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz kategori ID',
    type: ErrorResponseDto,
  })
  async findOne(@Param('id') id: string, @CurrentCompany() companyId: string): Promise<BaseResponseDto<CategoryDto>> {
    const query = new GetCategoryQuery(id, companyId);
    return this.queryBus.execute(query);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Kategori güncelle',
    description: "Belirtilen ID'ye sahip kategoriyi günceller.",
    operationId: 'updateCategory',
  })
  @ApiParam({
    name: 'id',
    description: 'Güncellenecek kategori ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    type: UpdateCategoryCommandDto,
    description:
      'Güncellenecek kategori bilgileri (kısmi güncelleme). ID isteğe bağlıdır, path parameter ile aynı olmalıdır.',
    examples: {
      example1: {
        summary: 'Kategori adı güncelle',
        value: {
          id: '507f1f77bcf86cd799439011',
          name: 'Yeni Ulaşım',
        },
      },
      example2: {
        summary: 'Aktiflik durumu güncelle (ID olmadan)',
        value: {
          isActive: false,
        },
      },
    },
  })
  @ApiCommandResponse()
  @ApiNotFoundResponse({
    description: 'Güncellenecek kategori bulunamadı',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz kategori ID veya güncelleme verisi',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Bu isimde başka bir kategori zaten mevcut',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryCommandDto,
    @CurrentCompany() companyId: string
  ): Promise<CommandResponseDto> {
    const command = new UpdateCategoryCommand(id, companyId, updateCategoryDto);
    return this.commandBus.execute(command);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Kategori sil',
    description: "Belirtilen ID'ye sahip kategoriyi siler. Bu işlem geri alınamaz.",
    operationId: 'deleteCategory',
  })
  @ApiParam({
    name: 'id',
    description: 'Silinecek kategori ID (MongoDB ObjectId)',
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiCommandResponse()
  @ApiNotFoundResponse({
    description: 'Silinecek kategori bulunamadı',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz kategori ID',
    type: ErrorResponseDto,
  })
  async remove(@Param('id') id: string, @CurrentCompany() companyId: string): Promise<CommandResponseDto> {
    const command = new DeleteCategoryCommand(id, companyId);
    return this.commandBus.execute(command);
  }
}
