import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class UserDto {
  @ApiProperty({ example: '665b776f58e4d5be07e7e8c4', description: 'ID' })
  @Expose()
  @Transform(({ obj }) => obj._id?.toString(), { toClassOnly: true })
  id: string;

  @ApiProperty({ example: '2024-01-01T12:00:00.000Z', description: 'Oluşturulma tarihi' })
  @Expose()
  createdAt: string;

  @ApiProperty({ example: '2024-01-01T12:05:00.000Z', description: 'Güncellenme tarihi' })
  @Expose()
  updatedAt: string;

  @ApiProperty({ example: 'johndoe', description: 'Kullanıcı adı' })
  @Expose()
  username: string;

  @ApiProperty({ example: 'johndoe@example.com', description: 'Kullanıcı e-posta adresi' })
  @Expose()
  email: string;

  @ApiProperty({ example: 'user', description: 'Kullanıcı rolü (user, admin, superadmin)' })
  @Expose()
  role: string;

  @ApiProperty({ example: true, description: 'Kullanıcının aktiflik durumu' })
  @Expose()
  isActive: boolean;
}
