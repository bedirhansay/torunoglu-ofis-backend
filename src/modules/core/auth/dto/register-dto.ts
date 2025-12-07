import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'bedirhansay',
    description: 'Kullanıcının kullanıcı adı',
  })
  @IsString()
  @MinLength(3, { message: 'Kullanıcı adı en az 3 karakter olmalıdır' })
  username: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Kullanıcının e-posta adresi',
  })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi girilmelidir' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Kullanıcının şifresi (en az 8 karakter, büyük harf, küçük harf, rakam ve özel karakter içermelidir)',
  })
  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message:
        'Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter (@$!%*?&) içermelidir',
    },
  )
  password: string;
}
