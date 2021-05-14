import { OrderCreatedEvent, OrderStatus } from '@barrozito/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';

import { Order } from '../../../models/order';
import { natsClient } from '../../../nats-client';
import { OrderCreatedListener } from '../order-created-listener';

const setup = async () => {
  const listener = new OrderCreatedListener(natsClient.client);

  const data: OrderCreatedEvent['data'] = {
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    expiresAt: 'fzfeefzef',
    userId: 'frergerge',
    status: OrderStatus.Created,
    ticket: {
      id: 'fefezfezf',
      price: 10,
    },
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, msg };
};

describe('Testing order:created event', () => {
  it('replicates the order info', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    // Check if order was saved in database
    const order = await Order.findById(data.id);

    expect(order!.price).toEqual(data.ticket.price);
  });

  it('acknowledges the message', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
  });
});
