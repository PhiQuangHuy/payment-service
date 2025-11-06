import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { UpdatePaymentDto } from '../dtos/update-payment.dto';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      status: PaymentStatus.PENDING,
    });

    return await this.paymentRepository.save(payment);
  }

  async findAll(): Promise<Payment[]> {
    return await this.paymentRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Payment | null> {
    return await this.paymentRepository.findOne({ where: { id } });
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByCustomerId(customerId: string): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment | null> {
    await this.paymentRepository.update(id, updatePaymentDto);
    return await this.findById(id);
  }

  async updateStatus(
    id: string,
    status: PaymentStatus,
    transactionId?: string,
  ): Promise<Payment | null> {
    const updateData: any = { status };

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    if (status === PaymentStatus.COMPLETED || status === PaymentStatus.FAILED) {
      updateData.processedAt = new Date();
    }

    await this.paymentRepository.update(id, updateData);
    return await this.findById(id);
  }

  async setFailureReason(id: string, reason: string): Promise<Payment | null> {
    await this.paymentRepository.update(id, {
      status: PaymentStatus.FAILED,
      failureReason: reason,
      processedAt: new Date(),
    });
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.paymentRepository.delete(id);
    if (!result.affected) {
      throw new InternalServerErrorException(
        `Failed to update order with ID id`,
      );
    }
    return result.affected > 0;
  }
}
