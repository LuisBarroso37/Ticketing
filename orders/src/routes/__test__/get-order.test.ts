import request from 'supertest';
import mongoose from 'mongoose';

import { app } from '../../app';
import { buildTicket } from './utils';

const orderIdParam = mongoose.Types.ObjectId();

describe('Testing getting specific order', () => {
  it('has a route handler listening to /api/orders/:id  for get requests', async () => {
    const response = await request(app)
      .get(`/api/orders/${orderIdParam}`)
      .send({});

    expect(response.status).not.toEqual(404);
  });

  it('can only be accessed if user is signed in', async () => {
    const response = await request(app)
      .get(`/api/orders/${orderIdParam}`)
      .send({});

    expect(response.status).toEqual(401);
  });

  it('returns a status other than 401 if user is signed in', async () => {
    const response = await request(app)
      .get(`/api/orders/${orderIdParam}`)
      .set('Cookie', global.signin())
      .send({});

    expect(response.status).not.toEqual(401);
  });

  it('fetches a particular order', async () => {
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

    // Get created order
    const { body: fetchedOrder } = await request(app)
      .get(`/api/orders/${order.id}`)
      .set('Cookie', user)
      .send()
      .expect(200);

    expect(fetchedOrder.id).toEqual(order.id);
  });

  it('returns an error if an user tries to fetch an order not linked to him/her', async () => {
    // Create ticket
    const ticket = await buildTicket('concert', 20);

    // Set cookie that identifies a user
    const user = global.signin();

    // Create an order as a particular user
    const { body: order } = await request(app)
      .post('/api/orders')
      .set('Cookie', user)
      .send({ ticketId: ticket.id })
      .expect(201);

    // Try to get created order as a different user
    await request(app)
      .get(`/api/orders/${order.id}`)
      .set('Cookie', global.signin())
      .send()
      .expect(401);
  });
});
