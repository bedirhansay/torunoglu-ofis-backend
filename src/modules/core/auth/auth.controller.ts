import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ErrorResponseDto } from '../../../common/types/response/error.response.dto';
import { LoginCommand } from './commands/login.command';
import { RegisterCommand } from './commands/register.command';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto } from './dto/register-dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Yeni kullanıcı kaydı oluşturur' })
  @ApiCreatedResponse({
    description: 'Kullanıcı başarıyla kaydedildi',
    example: {
      user: {
        id: '665b77abc123456789abcdef',
        username: 'bedirhansay',
        email: 'bedirhan@example.com',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz kullanıcı bilgileri',
    type: ErrorResponseDto,
    example: {
      success: false,
      statusCode: 400,
      message: ['username must be longer than or equal to 3 characters', 'email must be an email'],
      error: 'BadRequestException',
      path: '/api/auth/register',
      timestamp: '2025-01-15T12:00:00.000Z',
    },
  })
  @ApiConflictResponse({
    description: 'Bu kullanıcı adı veya email zaten kullanılıyor',
    type: ErrorResponseDto,
    example: {
      success: false,
      statusCode: 409,
      message: 'Bu kullanıcı adı zaten kullanılıyor',
      error: 'ConflictException',
      path: '/api/auth/register',
      timestamp: '2025-01-15T12:00:00.000Z',
    },
  })
  @ApiTooManyRequestsResponse({
    description: 'Çok fazla kayıt denemesi (rate limit)',
    type: ErrorResponseDto,
    example: {
      success: false,
      statusCode: 429,
      message: 'Too Many Requests',
      error: 'ThrottlerException',
      path: '/api/auth/register',
      timestamp: '2025-01-15T12:00:00.000Z',
    },
  })
  async register(@Body() dto: RegisterDto) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Kayıt işlemi production ortamında kapalıdır');
    }
    const command = new RegisterCommand(dto.username, dto.email, dto.password);
    return this.commandBus.execute(command);
  }

  @Post('login')
  @ApiOperation({ summary: 'Kullanıcı girişi yapar' })
  @ApiOkResponse({
    description: 'Giriş başarılı',
    type: LoginResponseDto,
    example: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: {
        id: '665b77abc123456789abcdef',
        username: 'bedirhansay',
        email: 'bedirhan@example.com',
        role: 'user',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Geçersiz istek (username veya password eksik)',
    type: ErrorResponseDto,
    example: {
      success: false,
      statusCode: 400,
      message: ['username should not be empty', 'password should not be empty'],
      error: 'BadRequestException',
      path: '/api/auth/login',
      timestamp: '2025-01-15T12:00:00.000Z',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Geçersiz kullanıcı adı veya şifre',
    type: ErrorResponseDto,
    example: {
      success: false,
      statusCode: 401,
      message: 'Geçersiz kullanıcı adı veya şifre',
      error: 'UnauthorizedException',
      path: '/api/auth/login',
      timestamp: '2025-01-15T12:00:00.000Z',
    },
  })
  @ApiTooManyRequestsResponse({
    description: 'Çok fazla giriş denemesi (rate limit)',
    type: ErrorResponseDto,
    example: {
      success: false,
      statusCode: 429,
      message: 'Too Many Requests',
      error: 'ThrottlerException',
      path: '/api/auth/login',
      timestamp: '2025-01-15T12:00:00.000Z',
    },
  })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const command = new LoginCommand(dto.username, dto.password);
    return this.commandBus.execute(command);
  }
}
