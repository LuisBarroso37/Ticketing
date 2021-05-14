import { Message } from 'node-nats-streaming';
import { OrderCancelledEvent } from '@barrozito/common';
import mongoose from 'mongoose';

import { Ticket } from '../../../models/ticket';
import { natsClient } from '../../../nats-client';
import { OrderCancelledListener } from '../order-cancelled-listener';

const setup = async () => {
  // Create an instance of the listener
  const listener = new OrderCancelledListener(natsClient.client);

  // Create and save a ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 99,
    userId: mongoose.Types.ObjectId().toHexString(),
  });

  const orderId = mongoose.Types.ObjectId().toHexString();
  ticket.set({ orderId });
  await ticket.save();

  // Create fake data event
  const data: OrderCancelledEvent['data'] = {
    id: orderId,
    version: 0,
    ticket: {
      id: ticket.id,
    },
  };

  // Create fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { msg, data, ticket, orderId, listener };
};

describe('Testing order cancelled listener', () => {
  it('sets the orderId of the ticket to undefined', async () => {
    const { msg, data, ticket, orderId, listener } = await setup();

    await listener.onMessage(data, msg);

    // Check if ticket was updated and no longer has orderId
    const updatedTicket = await Ticket.findById(ticket.id);
    expect(updatedTicket!.orderId).not.toBeDefined();
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
    expect(ticketUpdatedData.orderId).toEqual(undefined);
    expect(data.ticket.id).toEqual(ticketUpdatedData.id);
  });
});
