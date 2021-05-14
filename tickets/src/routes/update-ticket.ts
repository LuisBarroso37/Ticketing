import { natsClient } from './../nats-client';
import express, { Request, Response } from 'express';
import { body } from 'express-validator';

import {
  validateRequest,
  NotFoundError,
  requireAuth,
  BadRequestError,
  NotAuthorizedError,
} from '@barrozito/common';
import { Ticket } from '../models/ticket';
import { TicketUpdatedPublisher } from '../events/publishers/ticket-updated-publisher';

const router = express.Router();

router.put(
  '/api/tickets/:id',
  requireAuth,
  [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('price')
      .isFloat({ gt: 0 })
      .withMessage('Price must be greater than zero'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, price } = req.body;

    // Find ticket by id
    const ticket = await Ticket.findById(id);

    // Throw error if ticket is not found
    if (!ticket) throw new NotFoundError();

    // Throw error if the id on the ticket and the current user id don't match
    if (ticket.userId !== req.currentUser!.id) throw new NotAuthorizedError();

    // Throw error if ticket is reserved (has an orderId)
    if (ticket.orderId)
      throw new BadRequestError('Cannot edit a reserved ticket');

    // Update existing ticket
    ticket.set({
      title,
      price,
    });

    // Save ticket to MongoDB
    await ticket.save();

    // Publish Ticket Updated event to NATS
    await new TicketUpdatedPublisher(natsClient.client).publish({
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      version: ticket.version,
    });

    res.send(ticket);
  }
);

export { router as updateTicketRouter };
