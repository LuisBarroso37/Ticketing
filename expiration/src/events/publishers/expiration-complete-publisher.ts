import {
  Publisher,
  ExpirationCompleteEvent,
  Subjects,
} from '@barrozito/common';

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  readonly subject = Subjects.ExpirationComplete;
}
