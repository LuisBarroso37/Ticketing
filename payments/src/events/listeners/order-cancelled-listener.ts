import {
  Listener,
  OrderCancelledEvent,
  OrderStatus,
  Subjects,
} from '@barrozito/common';
import { Message } from 'node-nats-streaming';

import { Order } from '../../models/order';
import { queueGroupName } from './queue-group-name';

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    try {
      const order = await Order.findOne({
        _id: data.id,
        version: data.version - 1,
      });

      if (!order) {
        throw new Error('Order not found');
      }

      order.set({ status: OrderStatus.Cancelled });
      await order.save();

      // Acknowledge the message
      msg.ack();
    } catch (err) {}
  }
}
