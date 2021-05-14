import { ExpirationCompleteEvent, OrderStatus } from '@barrozito/common';
import mongoose from 'mongoose';

import { Order } from '../../../models/order';
import { Ticket } from '../../../models/ticket';
import { natsClient } from '../../../nats-client';
import { ExpirationCompleteListener } from '../expiration-complete-listener';

const setup = async () => {
  // Create an instance of the listener
  const listener = new ExpirationCompleteListener(natsClient.client);

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
  const data: ExpirationCompleteEvent['data'] = {
    orderId: order.id,
  };

  // Create fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, order, data, msg };
};

describe('Testing expiration completed listener', () => {
  it('updated the order status to cancelled', async () => {
    const { listener, order, data, msg } = await setup();

    await listener.onMessage(data, msg);

    const updatedOrder = await Order.findById(order.id);
    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
  });

  it('emit an order:cancelled event', async () => {
    const { listener, order, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(natsClient.client.publish).toHaveBeenCalled();
    const eventData = JSON.parse(
      (natsClient.client.publish as jest.Mock).mock.calls[0][1]
    );
    expect(eventData.id).toEqual(order.id);
  });

  it('acknowledges the message', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
  });
});
