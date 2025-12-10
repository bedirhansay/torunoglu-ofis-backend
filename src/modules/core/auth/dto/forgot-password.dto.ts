import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Kullanıcı email adresi',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz' })
  @IsNotEmpty({ message: 'Email adresi zorunludur' })
  email: string;
}
