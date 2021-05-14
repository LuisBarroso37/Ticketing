import { TicketUpdatedEvent } from '@barrozito/common';
import mongoose from 'mongoose';

import { Ticket } from '../../../models/ticket';
import { natsClient } from '../../../nats-client';
import { TicketUpdatedListener } from '../ticket-updated-listener';

const setup = async () => {
  // Create an instance of the listener
  const listener = new TicketUpdatedListener(natsClient.client);

  // Create and save a ticket
  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20,
  });

  await ticket.save();

  // Create fake data event
  const data: TicketUpdatedEvent['data'] = {
    id: ticket.id,
    version: ticket.version + 1,
    title: 'new concert',
    price: 25,
    userId: 'ezefzefe',
  };

  // Create fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, ticket, data, msg };
};

describe('Testing ticket updated listener', () => {
  it('finds, updates and saves a ticket', async () => {
    const { listener, ticket, data, msg } = await setup();

    // Call onMessage function with the data object + event object
    await listener.onMessage(data, msg);

    const updatedTicket = await Ticket.findById(ticket.id);
    expect(updatedTicket).toBeDefined();
    expect(updatedTicket!.version).toEqual(data.version);
    expect(updatedTicket!.title).toEqual(data.title);
    expect(updatedTicket!.price).toEqual(data.price);
  });

  it('acknowledges the message', async () => {
    const { listener, data, msg } = await setup();

    // Call onMessage function with the data object + event object
    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
  });

  it('does not acknowledge the message if the event has skipped a version number', async () => {
    const { listener, data, msg } = await setup();

    // Change version number in the data object
    data.version = 10;

    // Call onMessage function with the data object + event object
    try {
      await listener.onMessage(data, msg);
    } catch (err) {}

    expect(msg.ack).not.toHaveBeenCalled();
  });
});
