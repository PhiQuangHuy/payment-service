// import { forwardRef, Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Payment } from './entities/payment.entity';
// import { PaymentController } from './controllers/payment.controller';
// import { PaymentService } from './services/payment.service';
// import { PaymentRepository } from './repositories/payment.repository';
// import { KafkaModule } from '../kafka/kafka.module';

// @Module({
//   imports: [TypeOrmModule.forFeature([Payment]), forwardRef(() => KafkaModule)],
//   controllers: [PaymentController],
//   providers: [PaymentService, PaymentRepository],
//   exports: [PaymentService],
// })
// export class PaymentModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Payment } from './entities/payment.entity';
import { PaymentController } from './controllers/payment.controller';
import { PaymentRepository } from './repositories/payment.repository';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), SharedModule],
  controllers: [PaymentController],
  providers: [PaymentRepository],
  exports: [],
})
export class PaymentModule {}
