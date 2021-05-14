import request from 'supertest';
import mongoose from 'mongoose';

import { app } from '../../app';
import { buildTicket } from './utils';
import { Order, OrderStatus } from '../../models/order';
import { natsClient } from '../../nats-client';

const orderIdParam = mongoose.Types.ObjectId();

describe('Testing cancelling specific order', () => {
  it('has a route handler listening to /api/orders/:id for put requests', async () => {
    const response = await request(app)
      .put(`/api/orders/${orderIdParam}`)
      .send({});

    expect(response.status).not.toEqual(404);
  });

  it('can only be accessed if user is signed in', async () => {
    const response = await request(app)
      .put(`/api/orders/${orderIdParam}`)
      .send({});

    expect(response.status).toEqual(401);
  });

  it('returns a status other than 401 if user is signed in', async () => {
    const response = await request(app)
      .put(`/api/orders/${orderIdParam}`)
      .set('Cookie', global.signin())
      .send({});

    expect(response.status).not.toEqual(401);
  });

  it('returns an error if an user tries to cancel an order not linked to him/her', async () => {
    // Create ticket
    const ticket = await buildTicket('concert', 20);

    // Set cookie that identifies a user
    const user = global.signin();

    // Create an order for created ticket
    const { body: order } = await request(app)
      .post('/api/orders')
      .set('Cookie', user)
      .send({ ticketId: ticket.id })
      .expect(201);

    // Try to cancel created order as a different user
    await request(app)
      .put(`/api/orders/${order.id}`)
      .set('Cookie', global.signin())
      .send()
      .expect(401);
  });

  it('cancels a particular order', async () => {
    // Create ticket
    const ticket = await buildTicket('concert', 20);

    // Set cookie that identifies a user
    const user = global.signin();

    // Create an order
    const { body: order } = await request(app)
      .post('/api/orders')
      .set('Cookie', user)
      .send({ ticketId: ticket.id })
      .expect(201);

    // Cancel created order
    await request(app)
      .put(`/api/orders/${order.id}`)
      .set('Cookie', user)
      .send()
      .expect(200);

    const updatedOrder = await Order.findById(order.id);

    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
  });

  it('publishes an order:cancelled event', async () => {
    // Create ticket
    const ticket = await buildTicket('concert', 20);

    // Set cookie that identifies a user
    const user = global.signin();

    // Create an order
    const { body: order } = await request(app)
      .post('/api/orders')
      .set('Cookie', user)
      .send({ ticketId: ticket.id })
      .expect(201);

    // Cancel created order
    await request(app)
      .put(`/api/orders/${order.id}`)
      .set('Cookie', user)
      .send()
      .expect(200);

    expect(natsClient.client.publish).toHaveBeenCalled();
  });
});
