import express from 'express';
import 'express-async-errors';
import cookieSession from 'cookie-session';
import { errorHandler, NotFoundError, currentUser } from '@barrozito/common';

import { getAllOrdersRouter } from './routes/get-all-orders';
import { getOrderRouter } from './routes/get-order';
import { createOrderRouter } from './routes/create-order';
import { cancelOrderRouter } from './routes/cancel-order';

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

app.use(getAllOrdersRouter);
app.use(getOrderRouter);
app.use(createOrderRouter);
app.use(cancelOrderRouter);

app.all('*', () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
