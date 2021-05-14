import request from 'supertest';
import mongoose from 'mongoose';

import { app } from '../../app';
import { natsClient } from '../../nats-client';
import { Order, OrderStatus } from '../../models/order';
import { Ticket } from '../../models/ticket';
import { buildTicket } from './utils';

describe('Testing order creation', () => {
  it('has a route handler listening to /api/orders for post requests', async () => {
    const response = await request(app).post('/api/orders').send({});

    expect(response.status).not.toEqual(404);
  });

  it('can only be accessed if user is signed in', async () => {
    const response = await request(app).post('/api/orders').send({});

    expect(response.status).toEqual(401);
  });

  it('returns a status other than 401 if user is signed in', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Cookie', global.signin())
      .send({});

    expect(response.status).not.toEqual(401);
  });

  it('returns an error if an invalid ticketId is provided', async () => {
    await request(app)
      .post('/api/orders')
      .set('Cookie', global.signin())
      .send({
        ticketId: '',
      })
      .expect(400);

    await request(app)
      .post('/api/orders')
      .set('Cookie', global.signin())
      .send({
        ticketId: 'fjzkefjbzekjf', // Not a mongoose ObjectId
      })
      .expect(400);
  });

  it('returns an error if the ticket does not exist', async () => {
    const ticketId = mongoose.Types.ObjectId();

    // No ticket saved in database
    await request(app)
      .post('/api/orders')
      .set('Cookie', global.signin())
      .send({ ticketId })
      .expect(404);
  });

  it('returns an error if the ticket is already reserved', async () => {
    // Create ticket
    const ticket = Ticket.build({
      id: mongoose.Types.ObjectId().toHexString(),
      title: 'concert',
      price: 20,
    });

    // Save ticket in database
    await ticket.save();

    // Create order with created ticket
    const order = Order.build({
      ticket,
      userId: 'zefnzejfekz',
      status: OrderStatus.Created,
      expiresAt: new Date(),
    });

    // Save order in database
    await order.save();

    // Make new order for reserved ticket
    await request(app)
      .post('/api/orders')
      .set('Cookie', global.signin())
      .send({ ticketId: ticket.id })
      .expect(400);
  });

  it('reserves a ticket by creating an order', async () => {
    // Create ticket
    const ticket = await buildTicket('concert', 20);

    // Make new order for ticket that is not reserved
    await request(app)
      .post('/api/orders')
      .set('Cookie', global.signin())
      .send({ ticketId: ticket.id })
      .expect(201);
  });

  it('publishes an order:created event', async () => {
    // Create ticket
    const ticket = await buildTicket('concert', 20);

    await request(app)
      .post('/api/orders')
      .set('Cookie', global.signin())
      .send({ ticketId: ticket.id })
      .expect(201);

    expect(natsClient.client.publish).toHaveBeenCalled();
  });
});
