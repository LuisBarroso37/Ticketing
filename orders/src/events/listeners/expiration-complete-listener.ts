import { Message } from 'node-nats-streaming';
import {
  Subjects,
  Listener,
  ExpirationCompleteEvent,
  OrderStatus,
} from '@barrozito/common';

import { queueGroupName } from './queue-group-name';
import { Order } from '../../models/order';
import { OrderCancelledPublisher } from '../publishers/order-cancelled-publisher';
import { natsClient } from '../../nats-client';

export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent> {
  readonly subject = Subjects.ExpirationComplete;
  queueGroupName = queueGroupName;

  async onMessage(data: ExpirationCompleteEvent['data'], msg: Message) {
    try {
      const order = await Order.findById(data.orderId).populate('ticket');

      if (!order) {
        throw new Error('Order not found');
      }

      // Make sure we don't cancel an order that has already been paid for
      if (order.status == OrderStatus.Complete) {
        return msg.ack();
      }

      // Update order to have a cancelled status
      order.set({ status: OrderStatus.Cancelled });

      // Save order in database
      await order.save();

      // Publish an order:cancelled event
      await new OrderCancelledPublisher(natsClient.client).publish({
        id: order.id,
        version: order.version,
        ticket: {
          id: order.ticket.id,
        },
      });

      // Acknowledge the message
      msg.ack();
    } catch (err) {}
  }
}
