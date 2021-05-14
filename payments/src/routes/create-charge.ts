import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import {
  requireAuth,
  validateRequest,
  BadRequestError,
  NotFoundError,
  NotAuthorizedError,
  OrderStatus,
} from '@barrozito/common';

import { stripe } from '../stripe';
import { Order } from '../models/order';
import { Payment } from '../models/payment';
import { PaymentCreatedPublisher } from '../events/publishers/payment-created-publisher';
import { natsClient } from '../nats-client';

const router = express.Router();

router.post(
  '/api/payments',
  requireAuth,
  [
    body('token').not().isEmpty().withMessage('Token must have a value'),
    body('orderId').not().isEmpty().withMessage('OrderId must have a value'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { token, orderId } = req.body;

    // Find existing order
    const order = await Order.findById(orderId);

    //Throw error if order was not found
    if (!order) {
      throw new NotFoundError();
    }

    // Throw error if current user's id does not match user id in the order
    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    // Throw error if order already has cancelled status
    if (order.status === OrderStatus.Cancelled) {
      throw new BadRequestError('Cannot pay for a cancelled order');
    }

    // Create a charge
    const charge = await stripe.charges.create({
      currency: 'eur',
      amount: order.price * 100, // cents
      source: token,
    });

    // Save charge to database
    const payment = Payment.build({
      orderId,
      stripeId: charge.id,
    });
    await payment.save();

    // Publish payment:created event
    new PaymentCreatedPublisher(natsClient.client).publish({
      id: payment.id,
      orderId: payment.orderId,
      stripeId: payment.stripeId,
    });

    res.status(201).send({ id: payment.id });
  }
);

export { router as createChargeRouter };
