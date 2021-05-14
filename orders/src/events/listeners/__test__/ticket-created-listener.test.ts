import { TicketCreatedEvent } from '@barrozito/common';
import mongoose from 'mongoose';

import { Ticket } from '../../../models/ticket';
import { natsClient } from '../../../nats-client';
import { TicketCreatedListener } from '../ticket-created-listener';

const setup = async () => {
  // Create an instance of the listener
  const listener = new TicketCreatedListener(natsClient.client);

  // Create fake data event
  const data: TicketCreatedEvent['data'] = {
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    title: 'concert',
    price: 10,
    userId: mongoose.Types.ObjectId().toHexString(),
  };

  // Create fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, msg };
};

describe('Testing ticket created listener', () => {
  it('creates and saves a ticket', async () => {
    const { listener, data, msg } = await setup();

    // Call onMessage function with the data object + event object
    await listener.onMessage(data, msg);

    const ticket = await Ticket.findById(data.id);
    expect(ticket).toBeDefined();
    expect(ticket!.title).toEqual(data.title);
    expect(ticket!.price).toEqual(data.price);
  });

  it('acknowledges the message', async () => {
    const { listener, data, msg } = await setup();

    // Call onMessage function with the data object + event object
    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
  });
});
