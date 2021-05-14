import { Message } from 'node-nats-streaming';

import { Listener, OrderCancelledEvent, Subjects } from '@barrozito/common';
import { queueGroupName } from './queue-group-name';
import { Ticket } from '../../models/ticket';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    try {
      // Find the ticket that order is reserving
      const ticket = await Ticket.findById(data.ticket.id);

      // Throw error if ticket is not found
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Mark the ticket as not being reserved by setting its orderId property as undefined
      ticket.set({ orderId: undefined });

      // Save the ticket
      await ticket.save();

      // Publish ticket:updated event
      await new TicketUpdatedPublisher(this.client).publish({
        id: ticket.id,
        price: ticket.price,
        title: ticket.title,
        userId: ticket.userId,
        orderId: ticket.orderId,
        version: ticket.version,
      });

      // Acknowledge the message
      msg.ack();
    } catch (err) {}
  }
}
