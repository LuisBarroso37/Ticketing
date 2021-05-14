import express from 'express';
import 'express-async-errors';
import cookieSession from 'cookie-session';

import { errorHandler, NotFoundError, currentUser } from '@barrozito/common';
import { createChargeRouter } from './routes/create-charge';

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

app.use(createChargeRouter);

app.all('*', () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
