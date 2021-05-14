import { Message } from 'node-nats-streaming';
import { Subjects, Listener, TicketCreatedEvent } from '@barrozito/common';

import { queueGroupName } from './queue-group-name';
import { Ticket } from '../../models/ticket';

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: TicketCreatedEvent['data'], msg: Message) {
    try {
      const { id, title, price } = data;
      const ticket = Ticket.build({
        id,
        title,
        price,
      });

      await ticket.save();

      // Acknowledge that the event was processed if no errors ocurred
      msg.ack();
    } catch (err) {}
  }
}
