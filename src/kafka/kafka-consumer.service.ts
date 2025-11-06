import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { PaymentService } from '../payment/services/payment.service';

export interface OrderCreatedEvent {
  orderId: string;
  customerId: string;
  totalAmount: number;
  items: any[];
  createdAt: Date;
}

export interface OrderStatusChangedEvent {
  orderId: string;
  oldStatus: string;
  newStatus: string;
  updatedAt: Date;
}

export interface OrderDeletedEvent {
  orderId: string;
  customerId: string;
  deletedAt: Date;
}

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(private readonly paymentService: PaymentService) {
    this.kafka = new Kafka({
      clientId: 'payment-service-consumer',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });
    this.consumer = this.kafka.consumer({ groupId: 'payment-service-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topics: ['order.created', 'order.status.changed', 'order.deleted'],
    });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!message.value) return;
          const eventData = JSON.parse(message.value.toString());

          switch (topic) {
            case 'order.created':
              await this.handleOrderCreated(eventData);
              break;
            case 'order.status.changed':
              await this.handleOrderStatusChanged(eventData);
              break;
            case 'order.deleted':
              await this.handleOrderDeleted(eventData);
              break;
            default:
              console.log(`Unhandled topic: ${topic}`);
          }
        } catch (error) {
          console.error(`Error processing message from topic ${topic}:`, error);
        }
      },
    });

    console.log('Kafka consumer connected and listening');
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
    console.log('Kafka consumer disconnected');
  }

  private async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      console.log(`Processing order.created event for order ${event.orderId}`);
      await this.paymentService.handleOrderCreated(event);
      console.log(
        `Successfully processed order.created event for order ${event.orderId}`,
      );
    } catch (error) {
      console.error(`Failed to handle order.created event:`, error);
    }
  }

  private async handleOrderStatusChanged(
    event: OrderStatusChangedEvent,
  ): Promise<void> {
    try {
      console.log(
        `Processing order.status.changed event for order ${event.orderId}`,
      );
      // Handle order status changes if needed
      // For example, cancel pending payments if order is cancelled
      if (event.newStatus === 'cancelled') {
        // Logic to cancel related payments
        console.log(
          `Order ${event.orderId} was cancelled, handling related payments`,
        );
      }
    } catch (error) {
      console.error(`Failed to handle order.status.changed event:`, error);
    }
  }

  private async handleOrderDeleted(event: OrderDeletedEvent): Promise<void> {
    try {
      console.log(`Processing order.deleted event for order ${event.orderId}`);
      // Handle order deletion if needed
      // For example, cancel any pending payments for the deleted order
      console.log(`Order ${event.orderId} was deleted, handling cleanup`);
    } catch (error) {
      console.error(`Failed to handle order.deleted event:`, error);
    }
  }
}
