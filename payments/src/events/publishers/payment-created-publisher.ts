import { Subjects, Publisher, PaymentCreatedEvent } from '@barrozito/common';

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated;
}
