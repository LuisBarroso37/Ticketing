import { requireAuth } from '@barrozito/common';
import express, { Request, Response } from 'express';

import { Order } from '../models/order';

const router = express.Router();

router.get('/api/orders', requireAuth, async (req: Request, res: Response) => {
  // Get all orders for a particular user
  const orders = await Order.find({ userId: req.currentUser!.id }).populate(
    'ticket'
  );

  res.send(orders);
});

export { router as getAllOrdersRouter };
