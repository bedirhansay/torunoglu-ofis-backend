import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import { ApiBaseResponse, ApiCommandResponse, ApiPaginatedResponse } from '@common/decorator/swagger';
import { PaginatedSearchDTO } from '@common/dto/request/search.request.dto';
import { BaseResponseDto } from '@common/dto/response/base.response.dto';
import { CommandResponseDto } from '@common/dto/response/command-response.dto';
import { ErrorResponseDto } from '@common/dto/response/error.response.dto';
import { PaginatedResponseDto } from '@common/dto/response/paginated.response.dto';
import { CreateUserCommand } from './commands/create-user.command';
import { DeleteUserCommand } from './commands/delete-user.command';
import { UpdateUserCommand } from './commands/update-user.command';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { GetUserQuery } from './queries/get-user.query';
import { ListUsersQuery } from './queries/list-users.query';

@ApiTags('Users')
@ApiExtraModels(
  BaseResponseDto,
  PaginatedResponseDto,
  PaginatedSearchDTO,
  CommandResponseDto,
  UserDto,
  CreateUserDto,
  UpdateUserDto
)
@Controller('users')
@ApiBearerAuth('Bearer')
@ApiSecurity('x-company-id')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  @ApiOperation({ summary: 'Yeni kullanıcı oluştur', operationId: 'createUser' })
  @ApiCommandResponse()
  @ApiBody({ type: CreateUserDto })
  @ApiBadRequestResponse({ description: 'Geçersiz kullanıcı bilgileri', type: ErrorResponseDto })
  @ApiConflictResponse({ description: 'Bu kullanıcı adı veya email zaten kullanılıyor', type: ErrorResponseDto })
  async create(@Body() createUserDto: CreateUserDto) {
    const command = new CreateUserCommand(
      createUserDto.username,
      createUserDto.email,
      createUserDto.password,
      createUserDto.role,
      createUserDto.isActive
    );
    return this.commandBus.execute(command);
  }

  @Get()
  @ApiOperation({ summary: 'Tüm kullanıcıları listele', operationId: 'getAllUsers' })
  @ApiPaginatedResponse(UserDto)
  async findAll(@Query() query: PaginatedSearchDTO) {
    const listQuery = new ListUsersQuery(query.pageNumber, query.pageSize, query.search);
    return this.queryBus.execute(listQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ID ile kullanıcı getir', operationId: 'getUserById' })
  @ApiBaseResponse(UserDto)
  @ApiBadRequestResponse({ description: 'Geçersiz kullanıcı ID', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Kullanıcı bulunamadı', type: ErrorResponseDto })
  async findOne(@Param('id') id: string) {
    const query = new GetUserQuery(id);
    return this.queryBus.execute(query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Kullanıcı bilgilerini güncelle', operationId: 'updateUser' })
  @ApiCommandResponse()
  @ApiBody({ type: UpdateUserDto })
  @ApiBadRequestResponse({ description: 'Geçersiz kullanıcı ID veya güncelleme verisi', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Kullanıcı bulunamadı', type: ErrorResponseDto })
  @ApiConflictResponse({ description: 'Bu kullanıcı adı veya email zaten kullanılıyor', type: ErrorResponseDto })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const command = new UpdateUserCommand(
      id,
      updateUserDto.username,
      updateUserDto.email,
      updateUserDto.password,
      updateUserDto.role,
      updateUserDto.isActive
    );
    return this.commandBus.execute(command);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Kullanıcı sil', operationId: 'deleteUser' })
  @ApiCommandResponse()
  @ApiBadRequestResponse({ description: 'Geçersiz kullanıcı ID', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Kullanıcı bulunamadı', type: ErrorResponseDto })
  async remove(@Param('id') id: string) {
    const command = new DeleteUserCommand(id);
    return this.commandBus.execute(command);
  }
}
