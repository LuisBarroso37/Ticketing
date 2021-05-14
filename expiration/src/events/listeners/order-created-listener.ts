import { Listener, Subjects, OrderCreatedEvent } from '@barrozito/common';
import { Message } from 'node-nats-streaming';
import { expirationQueue } from '../../queues/expiration-queue';

import { queueGroupName } from './queue-group-name';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    try {
      // Get expiration time in miliseconds
      const delay = new Date(data.expiresAt).getTime() - new Date().getTime();

      // Add job to queue
      await expirationQueue.add({ orderId: data.id }, { delay });

      // Acknowledge the message
      msg.ack();
    } catch (err) {}
  }
}
