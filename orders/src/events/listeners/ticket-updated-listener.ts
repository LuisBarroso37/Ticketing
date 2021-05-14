import { Message } from 'node-nats-streaming';
import { Subjects, Listener, TicketUpdatedEvent } from '@barrozito/common';

import { queueGroupName } from './queue-group-name';
import { Ticket } from '../../models/ticket';

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: TicketUpdatedEvent['data'], msg: Message) {
    try {
      const { title, price } = data;
      const ticket = await Ticket.findByEvent(data);

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Update ticket and save it to database
      ticket.set({ title, price });
      await ticket.save();

      // Acknowledge that the event was processed if no errors ocurred
      msg.ack();
    } catch (err) {}
  }
}
