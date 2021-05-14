import { OrderStatus } from '@barrozito/common';
import mongoose from 'mongoose';
import request from 'supertest';

import { app } from '../../app';
import { Order } from '../../models/order';
import { Payment } from '../../models/payment';
import { natsClient } from '../../nats-client';
import { stripe } from '../../stripe';

describe('Testing create charge route', () => {
  it('has a route handler listening to /api/payments for post requests', async () => {
    const response = await request(app).post('/api/payments').send({});

    expect(response.status).not.toEqual(404);
  });

  it('can only be accessed if user is signed in', async () => {
    const response = await request(app).post('/api/payments').send({});

    expect(response.status).toEqual(401);
  });

  it('returns a status other than 401 if user is signed in', async () => {
    const response = await request(app)
      .post('/api/payments')
      .set('Cookie', global.signin())
      .send({});

    expect(response.status).not.toEqual(401);
  });

  it('returns a 400 when given an invalid token or orderId', async () => {
    await request(app)
      .post('/api/payments')
      .set('Cookie', global.signin())
      .send({
        token: '',
        orderId: mongoose.Types.ObjectId().toHexString(),
      })
      .expect(400);

    await request(app)
      .post('/api/payments')
      .set('Cookie', global.signin())
      .send({
        token: 'efezfzfef',
        orderId: '',
      })
      .expect(400);
  });

  it('returns a 404 when purchasing an order that does not exist', async () => {
    await request(app)
      .post('/api/payments')
      .set('Cookie', global.signin())
      .send({
        token: 'efezfzfef',
        orderId: mongoose.Types.ObjectId().toHexString(),
      })
      .expect(404);
  });

  it('returns a 401 when purchasing an order that does not belong to the user', async () => {
    // Create order as a specific user
    const order = Order.build({
      id: mongoose.Types.ObjectId().toHexString(),
      userId: mongoose.Types.ObjectId().toHexString(),
      version: 0,
      price: 20,
      status: OrderStatus.Created,
    });
    await order.save();

    // Try to pay for order as different user
    await request(app)
      .post('/api/payments')
      .set('Cookie', global.signin())
      .send({
        token: 'efezfzfef',
        orderId: order.id,
      })
      .expect(401);
  });

  it('returns a 400 when purchasing a cancelled order', async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();

    // Create order as a specific user
    const order = Order.build({
      id: mongoose.Types.ObjectId().toHexString(),
      userId,
      version: 0,
      price: 20,
      status: OrderStatus.Cancelled,
    });
    await order.save();

    // Try to pay for order as different user
    await request(app)
      .post('/api/payments')
      .set('Cookie', global.signin(userId))
      .send({
        token: 'efezfzfef',
        orderId: order.id,
      })
      .expect(400);
  });

  it('returns a 201 when given valid inputs', async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();

    // Create order as a specific user
    const order = Order.build({
      id: mongoose.Types.ObjectId().toHexString(),
      userId,
      version: 0,
      price: 20,
      status: OrderStatus.Created,
    });
    await order.save();

    await request(app)
      .post('/api/payments')
      .set('Cookie', global.signin(userId))
      .send({
        token: 'tok_visa', // this token always works for stripe test accounts
        orderId: order.id,
      })
      .expect(201);

    const chargeOptions = (stripe.charges.create as jest.Mock).mock.calls[0][0];
    expect(chargeOptions.source).toEqual('tok_visa');
    expect(chargeOptions.amount).toEqual(order.price * 100);
    expect(chargeOptions.currency).toEqual('eur');

    const charge = await (stripe.charges.create as jest.Mock).mock.results[0]
      .value;
    const payment = await Payment.findOne({
      orderId: order.id,
      stripeId: charge.id,
    });

    expect(payment).not.toBeNull();
    expect(payment!.stripeId).toEqual(charge.id);
  });

  it('publishes a payment:created event', async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();

    // Create order as a specific user
    const order = Order.build({
      id: mongoose.Types.ObjectId().toHexString(),
      userId,
      version: 0,
      price: 20,
      status: OrderStatus.Created,
    });
    await order.save();

    await request(app)
      .post('/api/payments')
      .set('Cookie', global.signin(userId))
      .send({
        token: 'tok_visa', // this token always works for stripe test accounts
        orderId: order.id,
      })
      .expect(201);

    expect(natsClient.client.publish).toHaveBeenCalled();
  });
});
