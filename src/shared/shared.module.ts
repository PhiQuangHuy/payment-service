// src/shared/shared.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Payment } from 'src/payment/entities/payment.entity';
import { PaymentRepository } from 'src/payment/repositories/payment.repository';
import { PaymentService } from 'src/payment/services/payment.service';
import { KafkaProducerService } from 'src/kafka/kafka-producer.service';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  providers: [PaymentService, PaymentRepository, KafkaProducerService, PaginationProvider],
  exports: [PaymentService, KafkaProducerService, TypeOrmModule],
})
export class SharedModule {}
