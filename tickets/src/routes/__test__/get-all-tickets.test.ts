import request from 'supertest';
import { app } from '../../app';

// Helper function to create tickets
export const createTicket = (title: string, price: number) => {
  return request(app).post('/api/tickets').set('Cookie', global.signin()).send({
    title,
    price,
  });
};

describe('Testing getting all tickets', () => {
  it('can fetch a list of tickets', async () => {
    await createTicket('concert1', 20);
    await createTicket('concert2', 10);

    const response = await request(app).get('/api/tickets').send().expect(200);

    expect(response.body.length).toEqual(2);
  });
});
