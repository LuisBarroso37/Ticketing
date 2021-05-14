import { Message } from 'node-nats-streaming';
import { OrderCreatedEvent, OrderStatus } from '@barrozito/common';
import mongoose from 'mongoose';

import { Ticket } from '../../../models/ticket';
import { natsClient } from '../../../nats-client';
import { OrderCreatedListener } from '../order-created-listener';

const setup = async () => {
  // Create an instance of the listener
  const listener = new OrderCreatedListener(natsClient.client);

  // Create and save a ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 99,
    userId: mongoose.Types.ObjectId().toHexString(),
  });
  await ticket.save();

  // Create fake data event
  const data: OrderCreatedEvent['data'] = {
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    status: OrderStatus.Created,
    expiresAt: 'rfergeg',
    userId: mongoose.Types.ObjectId().toHexString(),
    ticket: {
      id: ticket.id,
      price: ticket.price,
    },
  };

  // Create fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, ticket, data, msg };
};

describe('Testing order created listener', () => {
  it('sets the orderId of the ticket', async () => {
    const { listener, ticket, data, msg } = await setup();

    await listener.onMessage(data, msg);

    const updatedTicket = await Ticket.findById(ticket.id);

    expect(updatedTicket!.orderId).toEqual(data.id);
  });

  it('acknowledges the message', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
  });

  it('publishes a ticket:updated event', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(natsClient.client.publish).toHaveBeenCalled();
    const ticketUpdatedData = JSON.parse(
      (natsClient.client.publish as jest.Mock).mock.calls[0][1]
    );
    expect(data.id).toEqual(ticketUpdatedData.orderId);
    expect(data.ticket.id).toEqual(ticketUpdatedData.id);
  });
});
