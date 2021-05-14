import { Publisher, Subjects, TicketUpdatedEvent } from '@barrozito/common';

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated;
}
