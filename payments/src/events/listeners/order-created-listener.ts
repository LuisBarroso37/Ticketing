import { Listener, OrderCreatedEvent, Subjects } from '@barrozito/common';
import { Message } from 'node-nats-streaming';

import { Order } from '../../models/order';
import { queueGroupName } from './queue-group-name';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    try {
      // Create order and save it to database
      const order = await Order.build({
        id: data.id,
        price: data.ticket.price,
        status: data.status,
        userId: data.userId,
        version: data.version,
      });
      await order.save();

      // Acknowledge the message
      msg.ack();
    } catch (err) {}
  }
}
