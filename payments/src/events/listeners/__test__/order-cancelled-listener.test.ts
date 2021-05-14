import { OrderCancelledEvent, OrderStatus } from '@barrozito/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';

import { Order } from '../../../models/order';
import { natsClient } from '../../../nats-client';
import { OrderCancelledListener } from '../order-cancelled-listener';

const setup = async () => {
  const listener = new OrderCancelledListener(natsClient.client);

  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    status: OrderStatus.Created,
    price: 10,
    userId: 'fzeafzef',
    version: 0,
  });
  await order.save();

  const data: OrderCancelledEvent['data'] = {
    id: order.id,
    version: 1,
    ticket: {
      id: 'fefezfezf',
    },
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, order, data, msg };
};

describe('Testing order:cancelled event', () => {
  it('cancels the order', async () => {
    const { listener, order, data, msg } = await setup();

    await listener.onMessage(data, msg);

    // Check if order was saved in database
    const updatedOrder = await Order.findById(order.id);

    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
  });

  it('acknowledges the message', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
  });
});
