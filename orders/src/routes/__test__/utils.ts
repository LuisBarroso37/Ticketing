import mongoose from 'mongoose';

import { Ticket } from '../../models/ticket';

export const buildTicket = async (title: string, price: number) => {
  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title,
    price,
  });

  await ticket.save();

  return ticket;
};
