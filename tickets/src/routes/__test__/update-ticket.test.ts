import request from 'supertest';
import mongoose from 'mongoose';

import { app } from '../../app';
import { generateId } from './utils';
import { natsClient } from '../../nats-client';
import { Ticket } from '../../models/ticket';

describe('Testing updating a ticket', () => {
  it('returns a 404 if the provided id does not exist', async () => {
    // Generate mongoose id
    const id = generateId();

    await request(app)
      .put(`/api/tickets/${id}`)
      .set('Cookie', global.signin())
      .send({
        title: 'new concert',
        price: 25,
      })
      .expect(404);
  });

  it('returns a 401 if the user is not authenticated', async () => {
    // Generate mongoose id
    const id = generateId();

    await request(app)
      .put(`/api/tickets/${id}`)
      .send({
        title: 'new concert',
        price: 25,
      })
      .expect(401);
  });

  it('returns a 401 if the user does not own the ticket', async () => {
    const cookie = global.signin();

    // Create ticket as a different (random) user
    const response = await request(app)
      .post('/api/tickets')
      .set('Cookie', cookie)
      .send({
        title: 'concert',
        price: 20,
      });

    // Try to update the ticket without being the owner of the ticket
    await request(app)
      .put(`/api/tickets/${response.body.id}`)
      .set('Cookie', global.signin())
      .send({
        title: 'new concert',
        price: 25,
      })
      .expect(401);

    // Check if ticket remains unchanged
    const ticketResponse = await request(app)
      .get(`/api/tickets/${response.body.id}`)
      .send();

    expect(ticketResponse.body.title).toEqual('concert');
    expect(ticketResponse.body.price).toEqual(20);
  });

  it('returns a 400 if the user provides an invalid title or price', async () => {
    const cookie = global.signin();

    // Create ticket
    const response = await request(app)
      .post('/api/tickets')
      .set('Cookie', cookie)
      .send({
        title: 'concert',
        price: 20,
      });

    // Update ticket with invalid title
    await request(app)
      .put(`/api/tickets/${response.body.id}`)
      .set('Cookie', cookie)
      .send({
        title: '',
        price: 15,
      })
      .expect(400);

    // Update ticket with invalid price
    await request(app)
      .put(`/api/tickets/${response.body.id}`)
      .set('Cookie', cookie)
      .send({
        title: 'new concert',
        price: -10,
      })
      .expect(400);
  });

  it('updates the ticket given a valid title and price', async () => {
    const cookie = global.signin();

    // Create ticket
    const response = await request(app)
      .post('/api/tickets')
      .set('Cookie', cookie)
      .send({
        title: 'concert',
        price: 20,
      });

    // Update ticket
    await request(app)
      .put(`/api/tickets/${response.body.id}`)
      .set('Cookie', cookie)
      .send({
        title: 'new concert',
        price: 100,
      })
      .expect(200);

    // Check if ticket was updated
    const ticketResponse = await request(app)
      .get(`/api/tickets/${response.body.id}`)
      .send();

    expect(ticketResponse.body.title).toEqual('new concert');
    expect(ticketResponse.body.price).toEqual(100);
  });

  it('publishes an event', async () => {
    const cookie = global.signin();

    // Create ticket
    const response = await request(app)
      .post('/api/tickets')
      .set('Cookie', cookie)
      .send({
        title: 'concert',
        price: 20,
      });

    // Update ticket
    await request(app)
      .put(`/api/tickets/${response.body.id}`)
      .set('Cookie', cookie)
      .send({
        title: 'new concert',
        price: 100,
      })
      .expect(200);

    expect(natsClient.client.publish).toHaveBeenCalled();
  });

  it('rejects updates if ticket is reserved', async () => {
    const cookie = global.signin();

    // Create ticket
    const response = await request(app)
      .post('/api/tickets')
      .set('Cookie', cookie)
      .send({
        title: 'concert',
        price: 20,
      });

    // Update ticket with orderId
    const ticket = await Ticket.findById(response.body.id);
    ticket!.set({ orderId: mongoose.Types.ObjectId().toHexString() });
    await ticket!.save();

    // Update ticket
    await request(app)
      .put(`/api/tickets/${response.body.id}`)
      .set('Cookie', cookie)
      .send({
        title: 'new concert',
        price: 100,
      })
      .expect(400);
  });
});
