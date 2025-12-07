import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiCreatedResponse, ApiExcludeEndpoint, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';

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
    schema: {
      example: {
        user: {
          id: '665b77abc123456789abcdef',
          username: 'bedirhansay',
          email: 'bedirhan@example.com',
        },
      },
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
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Login için 5 istek/dakika
  @ApiOperation({ summary: 'Kullanıcı girişi yapar' })
  @ApiOkResponse({
    description: 'Giriş başarılı',
    type: LoginResponseDto,
  })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const command = new LoginCommand(dto.username, dto.password);
    return this.commandBus.execute(command);
  }
}

