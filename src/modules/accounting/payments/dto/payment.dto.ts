import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToInstance, Transform } from 'class-transformer';
import { BaseDto } from '../../../../common/types/base/base.dto';
import { CustomerDto } from '../../customers/dto/customer.dto';

@Exclude()
export class PaymentDto extends BaseDto {
  @ApiProperty({
    description: 'Ödeme yapılan müşteri bilgisi',
    type: () => CustomerDto,
  })
  @Expose()
  @Transform(
    ({ obj }) => {
      const customer = obj.customerId;
      return customer ? plainToInstance(CustomerDto, customer, { excludeExtraneousValues: true }) : null;
    },
    {
      toClassOnly: true,
    }
  )
  customer: Pick<CustomerDto, 'id' | 'name'>;

  @ApiProperty({ example: 1000, description: 'Ödeme miktarı (₺)' })
  @Expose()
  amount: number;

  @ApiProperty({ example: '2024-06-01T12:00:00.000Z', description: 'Ödeme işlem tarihi' })
  @Expose()
  operationDate: string;

  @ApiProperty({ example: 'Nakit ödeme', description: 'Açıklama' })
  @Expose()
  description: string;
}
