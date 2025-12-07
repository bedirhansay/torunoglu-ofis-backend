import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token',
    example: 'abc123def456...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Reset token zorunludur' })
  token: string;

  @ApiProperty({
    description: 'Yeni şifre',
    example: 'newSecurePassword123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'Yeni şifre zorunludur' })
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  newPassword: string;
}
