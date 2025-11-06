import { IsOptional, IsEnum, IsString } from 'class-validator';
import { PaymentStatus } from '../entities/payment.entity';

export class UpdatePaymentDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  gatewayResponse?: string;

  @IsOptional()
  @IsString()
  failureReason?: string;
}
