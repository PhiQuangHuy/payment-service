import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { UpdatePaymentDto } from '../dtos/update-payment.dto';
import { ProcessPaymentDto } from '../dtos/process-payment.dto';
import { PaymentResponseDto } from '../dtos/payment-response.dto';
import { PaymentStatus } from '../entities/payment.entity';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return await this.paymentService.createPayment(createPaymentDto);
  }

  @Post(':id/process')
  async processPayment(
    @Param('id') id: string,
    @Body() processPaymentDto: ProcessPaymentDto,
  ): Promise<PaymentResponseDto> {
    return await this.paymentService.processPayment(id, processPaymentDto);
  }

  @Post(':id/refund')
  async refundPayment(@Param('id') id: string): Promise<PaymentResponseDto> {
    return await this.paymentService.refundPayment(id);
  }

  @Post(':id/cancel')
  async cancelPayment(@Param('id') id: string): Promise<PaymentResponseDto> {
    return await this.paymentService.cancelPayment(id);
  }

  @Get()
  async getAllPayments(
    @Query('status') status?: PaymentStatus,
    @Query('customerId') customerId?: string,
    @Query('orderId') orderId?: string,
  ): Promise<PaymentResponseDto[]> {
    if (status) {
      return await this.paymentService.getPaymentsByStatus(status);
    }

    if (customerId) {
      return await this.paymentService.getPaymentsByCustomerId(customerId);
    }

    if (orderId) {
      return await this.paymentService.getPaymentsByOrderId(orderId);
    }

    return await this.paymentService.getAllPayments();
  }

  @Get(':id')
  async getPaymentById(@Param('id') id: string): Promise<PaymentResponseDto> {
    return await this.paymentService.getPaymentById(id);
  }

  @Put(':id')
  async updatePayment(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return await this.paymentService.updatePayment(id, updatePaymentDto);
  }
}
