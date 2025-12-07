import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'johndoe', description: 'Kullanıcı adı' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'johndoe@example.com', description: 'Geçerli bir e-posta adresi' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Şifre (en az 8 karakter, büyük harf, küçük harf, rakam ve özel karakter içermelidir)',
  })
  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter (@$!%*?&) içermelidir',
    },
  )
  password: string;

  @ApiProperty({
    example: 'user',
    description: 'Kullanıcı rolü',
    default: 'user',
    enum: ['user', 'admin', 'superadmin'],
    required: false,
  })
  @IsOptional()
  @IsIn(['user', 'admin', 'superadmin'])
  role?: string;

  @ApiProperty({
    example: true,
    description: 'Kullanıcının aktiflik durumu',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
