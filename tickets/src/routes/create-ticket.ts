import express, { Request, Response } from 'express';
import { requireAuth, validateRequest } from '@barrozito/common';
import { body } from 'express-validator';
import { Ticket } from '../models/ticket';
import { TicketCreatedPublisher } from '../events/publishers/ticket-created-publisher';
import { natsClient } from '../nats-client';

const router = express.Router();

router.post(
  '/api/tickets',
  requireAuth,
  [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('price')
      .isFloat({ gt: 0 })
      .withMessage('Price must be greater than zero'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { title, price } = req.body;

    // Create new ticket
    const ticket = Ticket.build({
      title,
      price,
      userId: req.currentUser!.id,
    });

    // Save ticket in MongoDB
    await ticket.save();

    // Publish Ticket Created event to NATS
    await new TicketCreatedPublisher(natsClient.client).publish({
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      version: ticket.version,
    });

    res.status(201).send(ticket);
  }
);

export { router as createTicketRouter };
