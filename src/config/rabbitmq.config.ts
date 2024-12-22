// src/config/rabbitmq.config.ts

export const RABBITMQ_CONFIG = {
  urls: ['amqp://admin:adminpassword@localhost:5672'],
  queue: 'test_queue',
  queueOptions: {
    durable: true,
  },
  prefetchCount: 1,
  persistent: true,
  // Remove noAck setting from here
};

export const RABBITMQ_CLIENT_CONFIG = {
  ...RABBITMQ_CONFIG,
  noAck: false, // This is for the client module
};

export const RABBITMQ_SERVER_CONFIG = {
  ...RABBITMQ_CONFIG,
  // Don't set noAck here for the server
};
