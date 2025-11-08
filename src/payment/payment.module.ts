import { Module } from '@nestjs/common';
import { PaymentController } from './controllers/payment.controller';
import { PaymentRepository } from './repositories/payment.repository';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [PaymentController],
  providers: [PaymentRepository],
  exports: [],
})
export class PaymentModule {}
