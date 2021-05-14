import express from 'express';
import 'express-async-errors';
import cookieSession from 'cookie-session';

import { errorHandler, NotFoundError, currentUser } from '@barrozito/common';
import { createTicketRouter } from './routes/create-ticket';
import { getTicketRouter } from './routes/get-ticket';
import { getAllTicketsRouter } from './routes/get-all-tickets';
import { updateTicketRouter } from './routes/update-ticket';

const app = express();

// Make sure Express is aware that is behind a proxy of Ingress nginx
// and accepts requests
app.set('trust proxy', true);

app.use(express.json());
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== 'test', // Make sure that we can make requests using http when testing
  })
);
app.use(currentUser);

app.use(createTicketRouter);
app.use(getTicketRouter);
app.use(getAllTicketsRouter);
app.use(updateTicketRouter);

app.all('*', () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
