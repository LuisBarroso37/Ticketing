import request from 'supertest';

import { app } from '../../app';
import { buildTicket } from './utils';

describe('Testing getting all orders for a particular user', () => {
  it('has a route handler listening to /api/orders for get requests', async () => {
    const response = await request(app).get('/api/orders').send({});

    expect(response.status).not.toEqual(404);
  });

  it('can only be accessed if user is signed in', async () => {
    const response = await request(app).get('/api/orders').send({});

    expect(response.status).toEqual(401);
  });

  it('returns a status other than 401 if user is signed in', async () => {
    const response = await request(app)
      .get('/api/orders')
      .set('Cookie', global.signin())
      .send({});

    expect(response.status).not.toEqual(401);
  });

  it('fetches orders for a particular user', async () => {
    // Create 3 tickets
    const ticket1 = await buildTicket('concert1', 20);
    const ticket2 = await buildTicket('concert2', 10);
    const ticket3 = await buildTicket('concert3', 35);

    // Set cookie that identifies 2 different users
    const user1 = global.signin();
    const user2 = global.signin();

    // Create one order as User #1
    await request(app)
      .post('/api/orders')
      .set('Cookie', user1)
      .send({ ticketId: ticket1.id })
      .expect(201);

    // Create two orders as User #2
    const { body: order1 } = await request(app)
      .post('/api/orders')
      .set('Cookie', user2)
      .send({ ticketId: ticket2.id })
      .expect(201);

    const { body: order2 } = await request(app)
      .post('/api/orders')
      .set('Cookie', user2)
      .send({ ticketId: ticket3.id })
      .expect(201);

    // Make request to get orders for User #2
    const response = await request(app)
      .get('/api/orders')
      .set('Cookie', user2)
      .expect(200);

    // Make sure we only got the orders for User #2
    expect(response.body.length).toEqual(2);
    expect(response.body[0].id).toEqual(order1.id);
    expect(response.body[1].id).toEqual(order2.id);
    expect(response.body[0].ticket.id).toEqual(ticket2.id);
    expect(response.body[1].ticket.id).toEqual(ticket3.id);
  });
});
