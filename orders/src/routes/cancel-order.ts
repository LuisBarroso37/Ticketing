import express, { Request, Response } from 'express';
import {
  requireAuth,
  NotFoundError,
  NotAuthorizedError,
} from '@barrozito/common';

import { Order, OrderStatus } from '../models/order';
import { natsClient } from '../nats-client';
import { OrderCancelledPublisher } from '../events/publishers/order-cancelled-publisher';
const router = express.Router();

router.put(
  '/api/orders/:orderId',
  requireAuth,
  async (req: Request, res: Response) => {
    const { orderId } = req.params;

    // Find order by id
    const order = await Order.findById(orderId).populate('ticket');

    // Throw error if order was not found
    if (!order) {
      throw new NotFoundError();
    }

    // Throw error if user is not the one who created the order
    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    // Update order status to cancelled and save ticket to db
    order.status = OrderStatus.Cancelled;
    await order.save();

    // Publish order:cancelled event
    new OrderCancelledPublisher(natsClient.client).publish({
      id: order.id,
      version: order.version,
      ticket: {
        id: order.ticket.id,
      },
    });

    res.send(order);
  }
);

export { router as cancelOrderRouter };
