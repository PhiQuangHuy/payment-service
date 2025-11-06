// import { forwardRef, Module } from '@nestjs/common';
// import { KafkaProducerService } from './kafka-producer.service';
// import { KafkaConsumerService } from './kafka-consumer.service';
// import { PaymentModule } from 'src/payment/payment.module';

// @Module({
//   imports: [forwardRef(() => PaymentModule)],
//   providers: [KafkaProducerService, KafkaConsumerService],
//   exports: [KafkaProducerService, KafkaConsumerService],
// })
// export class KafkaModule {}

import { Module } from '@nestjs/common';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaConsumerService } from './kafka-consumer.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [KafkaProducerService, KafkaConsumerService],
  exports: [KafkaProducerService, KafkaConsumerService],
})
export class KafkaModule {}
