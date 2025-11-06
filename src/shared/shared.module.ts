// src/shared/shared.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Payment } from 'src/payment/entities/payment.entity';
import { PaymentRepository } from 'src/payment/repositories/payment.repository';
import { PaymentService } from 'src/payment/services/payment.service';
import { KafkaProducerService } from 'src/kafka/kafka-producer.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])], // ✅ Required for OrderRepository
  providers: [PaymentService, PaymentRepository, KafkaProducerService],
  exports: [PaymentService, KafkaProducerService, TypeOrmModule],
})
export class SharedModule {}
