import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ProcessPaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentToken: string;

  @IsOptional()
  @IsString()
  cvv?: string;
}
