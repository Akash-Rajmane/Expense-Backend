import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTransactionDto {
  @IsNotEmpty()
  @IsString()
  payment_id: string;

  @IsNotEmpty()
  @IsString()
  order_id: string;
}

export class PaymentFailedDto {
  @IsNotEmpty()
  @IsString()
  order_id: string;
}
