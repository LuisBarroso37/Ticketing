import { Ticket } from './ticket';

export interface Order {
  id: string;
  expiresAt: string;
  ticket: Ticket;
  status: string;
}
