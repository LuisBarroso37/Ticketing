import { PaymentCreatedEvent, OrderStatus } from '@barrozito/common';
import mongoose from 'mongoose';

import { Order } from '../../../models/order';
import { Ticket } from '../../../models/ticket';
import { natsClient } from '../../../nats-client';
import { PaymentCreatedListener } from '../payment-created-listener';

const setup = async () => {
  // Create an instance of the listener
  const listener = new PaymentCreatedListener(natsClient.client);

  // Create a ticket
  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20,
  });
  await ticket.save();

  // Create an order associated with the ticket
  const order = Order.build({
    status: OrderStatus.Created,
    userId: 'fqsfqs',
    expiresAt: new Date(),
    ticket,
  });
  await order.save();

  // Create fake data event
  const data: PaymentCreatedEvent['data'] = {
    id: mongoose.Types.ObjectId().toHexString(),
    orderId: order.id,
    stripeId: mongoose.Types.ObjectId().toHexString(),
  };

  // Create fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, order, data, msg };
};

describe('Testing payment complete listener', () => {
  it('updated the order status to complete', async () => {
    const { listener, order, data, msg } = await setup();

    await listener.onMessage(data, msg);

    const updatedOrder = await Order.findById(order.id);
    expect(updatedOrder!.status).toEqual(OrderStatus.Complete);
  });

  it('acknowledges the message', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
  });
});
