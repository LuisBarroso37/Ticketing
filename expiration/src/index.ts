import { OrderCreatedListener } from './events/listeners/order-created-listener';
import { natsClient } from './nats-client';

// Function that connects to MongoDB database and starts Express server
const start = async () => {
  if (!process.env.NATS_CLUSTER_ID) {
    throw new Error('NATS_CLUSTER_ID must be defined');
  }

  if (!process.env.NATS_CLIENT_ID) {
    throw new Error('NATS_CLIENT_ID must be defined');
  }

  if (!process.env.NATS_URL) {
    throw new Error('NATS_URL must be defined');
  }

  try {
    // ticketing is the cluster id defined in nats-depl.yaml
    await natsClient.connect(
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL
    );

    // Close NATS client gracefully
    natsClient.client.on('close', () => {
      console.log('NATS connection closed');
      process.exit();
    });
    process.on('SIGINT', () => natsClient.client.close());
    process.on('SIGTERM', () => natsClient.client.close());

    // Start listening for events
    new OrderCreatedListener(natsClient.client).listen();
  } catch (err) {
    console.error(err);
  }
};

start();
