import {
  PaymentStatus,
  PaymentMethod,
  PaymentDetails,
} from '../entities/payment.entity';

export class PaymentResponseDto {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  gatewayResponse?: string;
  failureReason?: string;
  paymentDetails?: PaymentDetails;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}
