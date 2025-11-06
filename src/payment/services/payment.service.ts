import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PaymentRepository } from '../repositories/payment.repository';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { UpdatePaymentDto } from '../dtos/update-payment.dto';
import { ProcessPaymentDto } from '../dtos/process-payment.dto';
import { PaymentResponseDto } from '../dtos/payment-response.dto';
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
} from '../entities/payment.entity';
import { KafkaProducerService } from '../../kafka/kafka-producer.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async createPayment(
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    // Check if payment already exists for this order
    const existingPayments = await this.paymentRepository.findByOrderId(
      createPaymentDto.orderId,
    );
    const hasCompletedPayment = existingPayments.some(
      (p) => p.status === PaymentStatus.COMPLETED,
    );

    if (hasCompletedPayment) {
      throw new BadRequestException('Payment already completed for this order');
    }

    // Create payment record
    const payment = await this.paymentRepository.create(createPaymentDto);

    // Publish payment created event
    await this.kafkaProducer.publishPaymentCreated({
      paymentId: payment.id,
      orderId: payment.orderId,
      customerId: payment.customerId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      createdAt: payment.createdAt,
    });

    return this.mapToResponseDto(payment);
  }

  async processPayment(
    paymentId: string,
    processPaymentDto: ProcessPaymentDto,
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        `Payment ${paymentId} is not in pending status`,
      );
    }

    // Update status to processing
    await this.paymentRepository.updateStatus(
      paymentId,
      PaymentStatus.PROCESSING,
    );

    try {
      // Simulate payment processing
      const processingResult = await this.simulatePaymentProcessing(
        processPaymentDto,
        payment,
      );

      // Update payment with result
      const updatedPayment = await this.paymentRepository.updateStatus(
        paymentId,
        processingResult.success
          ? PaymentStatus.COMPLETED
          : PaymentStatus.FAILED,
        processingResult.transactionId,
      );

      if (!processingResult.success && processingResult.errorMessage) {
        await this.paymentRepository.setFailureReason(
          paymentId,
          processingResult.errorMessage,
        );
      }

      if (!updatedPayment) {
        throw new InternalServerErrorException(
          `Failed to update order with ID`,
        );
      }
      // Publish payment processed event
      await this.kafkaProducer.publishPaymentProcessed({
        paymentId: paymentId,
        orderId: payment.orderId,
        amount: payment.amount,
        success: processingResult.success,
        transactionId: processingResult.transactionId,
        processedAt: new Date(),
      });

      return this.mapToResponseDto(updatedPayment);
    } catch (error) {
      console.error(`Payment processing failed for ${paymentId}:`, error);

      // Update payment as failed
      const failedPayment = await this.paymentRepository.setFailureReason(
        paymentId,
        'Payment processing failed due to system error',
      );

      if (!failedPayment) {
        throw new InternalServerErrorException(
          `Failed to update order with ID `,
        );
      }

      // Publish failed payment event
      await this.kafkaProducer.publishPaymentProcessed({
        paymentId: paymentId,
        orderId: payment.orderId,
        amount: payment.amount,
        success: false,
        processedAt: new Date(),
      });

      return this.mapToResponseDto(failedPayment);
    }
  }

  async getAllPayments(): Promise<PaymentResponseDto[]> {
    const payments = await this.paymentRepository.findAll();
    return payments.map((payment) => this.mapToResponseDto(payment));
  }

  async getPaymentById(id: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return this.mapToResponseDto(payment);
  }

  async getPaymentsByOrderId(orderId: string): Promise<PaymentResponseDto[]> {
    const payments = await this.paymentRepository.findByOrderId(orderId);
    return payments.map((payment) => this.mapToResponseDto(payment));
  }

  async getPaymentsByCustomerId(
    customerId: string,
  ): Promise<PaymentResponseDto[]> {
    const payments = await this.paymentRepository.findByCustomerId(customerId);
    return payments.map((payment) => this.mapToResponseDto(payment));
  }

  async getPaymentsByStatus(
    status: PaymentStatus,
  ): Promise<PaymentResponseDto[]> {
    const payments = await this.paymentRepository.findByStatus(status);
    return payments.map((payment) => this.mapToResponseDto(payment));
  }

  async updatePayment(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentResponseDto> {
    const existingPayment = await this.paymentRepository.findById(id);
    if (!existingPayment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    const updatedPayment = await this.paymentRepository.update(
      id,
      updatePaymentDto,
    );

    if (!updatedPayment) {
      throw new InternalServerErrorException(`Failed to update order with ID`);
    }

    // Publish status change event if status changed
    if (
      updatePaymentDto.status &&
      updatePaymentDto.status !== existingPayment.status
    ) {
      await this.kafkaProducer.publishPaymentStatusChanged({
        paymentId: id,
        orderId: existingPayment.orderId,
        oldStatus: existingPayment.status,
        newStatus: updatePaymentDto.status,
        updatedAt: new Date(),
      });
    }

    return this.mapToResponseDto(updatedPayment);
  }

  async refundPayment(paymentId: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    try {
      // Simulate refund processing
      const refundResult = await this.simulateRefundProcessing(payment);

      if (refundResult.success) {
        const refundedPayment = await this.paymentRepository.updateStatus(
          paymentId,
          PaymentStatus.REFUNDED,
          refundResult.refundTransactionId,
        );

        if (!refundedPayment) {
          throw new InternalServerErrorException(
            `Failed to update order with ID `,
          );
        }

        // Publish refund processed event
        await this.kafkaProducer.publishPaymentRefunded({
          paymentId: paymentId,
          orderId: payment.orderId,
          amount: payment.amount,
          refundTransactionId: refundResult.refundTransactionId || '',
          refundedAt: new Date(),
        });

        return this.mapToResponseDto(refundedPayment);
      } else {
        throw new BadRequestException(
          `Refund failed: ${refundResult.errorMessage}`,
        );
      }
    } catch (error) {
      console.error(`Refund processing failed for ${paymentId}:`, error);
      throw new BadRequestException('Refund processing failed');
    }
  }

  async cancelPayment(paymentId: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Only pending payments can be cancelled');
    }

    const cancelledPayment = await this.paymentRepository.updateStatus(
      paymentId,
      PaymentStatus.CANCELLED,
    );

    if (!cancelledPayment) {
      throw new InternalServerErrorException(`Failed to update order with ID `);
    }

    // Publish payment cancelled event
    await this.kafkaProducer.publishPaymentCancelled({
      paymentId: paymentId,
      orderId: payment.orderId,
      customerId: payment.customerId,
      cancelledAt: new Date(),
    });

    return this.mapToResponseDto(cancelledPayment);
  }

  async handleOrderCreated(orderData: any): Promise<void> {
    // Auto-create payment record when order is created
    const createPaymentDto: CreatePaymentDto = {
      orderId: orderData.orderId,
      customerId: orderData.customerId,
      amount: orderData.totalAmount,
      paymentMethod: PaymentMethod.CREDIT_CARD, // Default method
    };

    await this.createPayment(createPaymentDto);
    console.log(`Auto-created payment for order ${orderData.orderId}`);
  }

  private async simulatePaymentProcessing(
    processPaymentDto: ProcessPaymentDto,
    payment: Payment,
  ): Promise<{
    success: boolean;
    transactionId?: string;
    errorMessage?: string;
  }> {
    // Simulate processing delay
    await this.delay(2000);

    // Simulate different payment outcomes
    const { paymentToken } = processPaymentDto;
    const { amount } = payment;

    // Simulate failure scenarios
    if (amount > 10000) {
      return {
        success: false,
        errorMessage: 'Amount exceeds daily limit',
      };
    }

    if (paymentToken === 'invalid_token') {
      return {
        success: false,
        errorMessage: 'Invalid payment token',
      };
    }

    if (paymentToken === 'insufficient_funds') {
      return {
        success: false,
        errorMessage: 'Insufficient funds',
      };
    }

    // Simulate random failures (10% chance)
    if (Math.random() < 0.1) {
      return {
        success: false,
        errorMessage: 'Payment gateway timeout',
      };
    }

    // Successful payment
    const transactionId = `txn_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    return {
      success: true,
      transactionId,
    };
  }

  private async simulateRefundProcessing(payment: Payment): Promise<{
    success: boolean;
    refundTransactionId?: string;
    errorMessage?: string;
  }> {
    // Simulate refund processing delay
    await this.delay(1500);

    // Simulate refund failure scenarios
    if (!payment.transactionId) {
      return {
        success: false,
        errorMessage: 'Original transaction ID is required',
      };
    }

    // Simulate random refund failures (5% chance)
    if (Math.random() < 0.05) {
      return {
        success: false,
        errorMessage: 'Refund processing failed',
      };
    }

    // Successful refund
    const refundTransactionId = `rfnd_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    return {
      success: true,
      refundTransactionId,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private mapToResponseDto(payment: Payment): PaymentResponseDto {
    return {
      id: payment.id,
      orderId: payment.orderId,
      customerId: payment.customerId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      transactionId: payment.transactionId,
      gatewayResponse: payment.gatewayResponse,
      failureReason: payment.failureReason,
      paymentDetails: payment.paymentDetails,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      processedAt: payment.processedAt,
    };
  }
}
