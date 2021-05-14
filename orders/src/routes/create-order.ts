import express, { Request, Response } from 'express';
import { requireAuth, validateRequest, OrderStatus } from '@barrozito/common';
import { NotFoundError, BadRequestError } from '@barrozito/common';
import { body } from 'express-validator';
import mongoose from 'mongoose';

import { Ticket } from '../models/ticket';
import { Order } from '../models/order';
import { OrderCreatedPublisher } from '../events/publishers/order-created-publisher';
import { natsClient } from '../nats-client';

const router = express.Router();

const EXPIRATION_WINDOW_SECONDS = 15 * 60;

router.post(
  '/api/orders',
  requireAuth,
  [
    body('ticketId')
      .not()
      .isEmpty()
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage('TicketId must be provided'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { ticketId } = req.body;

    // Check if ticket exists
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      throw new NotFoundError();
    }

    // Check if there is already an order pending for the ticket
    const existingOrder = await ticket.isReserved();

    // Throw error if there is already a pending order for the ticket
    if (existingOrder) {
      throw new BadRequestError('Ticket is already reserved');
    }

    // Calculate expiration date for this order
    const expirationDate = new Date();
    expirationDate.setSeconds(
      expirationDate.getSeconds() + EXPIRATION_WINDOW_SECONDS
    );

    // Create a new order for the ticket
    const order = Order.build({
      userId: req.currentUser!.id,
      status: OrderStatus.Created,
      expiresAt: expirationDate,
      ticket,
    });

    // Save order to database
    await order.save();

    // Publish order:created event
    new OrderCreatedPublisher(natsClient.client).publish({
      id: order.id,
      status: order.status,
      version: order.version,
      userId: order.userId,
      expiresAt: order.expiresAt.toISOString(), // UTC timestamp
      ticket: {
        id: ticket.id,
        price: ticket.price,
      },
    });

    res.status(201).send(order);
  }
);

export { router as createOrderRouter };
