import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { PaymentMethod } from '../payment/entities/payment.entity';

export interface PaymentCreatedEvent {
  paymentId: string;
  orderId: string;
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  createdAt: Date;
}

export interface PaymentProcessedEvent {
  paymentId: string;
  orderId: string;
  amount: number;
  success: boolean;
  transactionId?: string;
  processedAt: Date;
}

export interface PaymentStatusChangedEvent {
  paymentId: string;
  orderId: string;
  oldStatus: string;
  newStatus: string;
  updatedAt: Date;
}

export interface PaymentRefundedEvent {
  paymentId: string;
  orderId: string;
  amount: number;
  refundTransactionId: string;
  refundedAt: Date;
}

export interface PaymentCancelledEvent {
  paymentId: string;
  orderId: string;
  customerId: string;
  cancelledAt: Date;
}

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'payment-service-producer',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    console.log('Kafka producer connected');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    console.log('Kafka producer disconnected');
  }

  async publishPaymentCreated(event: PaymentCreatedEvent): Promise<void> {
    try {
      await this.producer.send({
        topic: 'payment.created',
        messages: [
          {
            key: event.paymentId,
            value: JSON.stringify(event),
            timestamp: Date.now().toString(),
          },
        ],
      });
      console.log(
        `Published payment.created event for payment ${event.paymentId}`,
      );
    } catch (error) {
      console.error('Failed to publish payment.created event:', error);
      throw error;
    }
  }

  async publishPaymentProcessed(event: PaymentProcessedEvent): Promise<void> {
    try {
      await this.producer.send({
        topic: 'payment.processed',
        messages: [
          {
            key: event.paymentId,
            value: JSON.stringify(event),
            timestamp: Date.now().toString(),
          },
        ],
      });
      console.log(
        `Published payment.processed event for payment ${event.paymentId}`,
      );
    } catch (error) {
      console.error('Failed to publish payment.processed event:', error);
      throw error;
    }
  }

  async publishPaymentStatusChanged(
    event: PaymentStatusChangedEvent,
  ): Promise<void> {
    try {
      await this.producer.send({
        topic: 'payment.status.changed',
        messages: [
          {
            key: event.paymentId,
            value: JSON.stringify(event),
            timestamp: Date.now().toString(),
          },
        ],
      });
      console.log(
        `Published payment.status.changed event for payment ${event.paymentId}`,
      );
    } catch (error) {
      console.error('Failed to publish payment.status.changed event:', error);
      throw error;
    }
  }

  async publishPaymentRefunded(event: PaymentRefundedEvent): Promise<void> {
    try {
      await this.producer.send({
        topic: 'payment.refunded',
        messages: [
          {
            key: event.paymentId,
            value: JSON.stringify(event),
            timestamp: Date.now().toString(),
          },
        ],
      });
      console.log(
        `Published payment.refunded event for payment ${event.paymentId}`,
      );
    } catch (error) {
      console.error('Failed to publish payment.refunded event:', error);
      throw error;
    }
  }

  async publishPaymentCancelled(event: PaymentCancelledEvent): Promise<void> {
    try {
      await this.producer.send({
        topic: 'payment.cancelled',
        messages: [
          {
            key: event.paymentId,
            value: JSON.stringify(event),
            timestamp: Date.now().toString(),
          },
        ],
      });
      console.log(
        `Published payment.cancelled event for payment ${event.paymentId}`,
      );
    } catch (error) {
      console.error('Failed to publish payment.cancelled event:', error);
      throw error;
    }
  }
}
