import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RmqOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // add a prefix to all routes
  app.setGlobalPrefix('api');
  // Connect to RabbitMQ
  app.connectMicroservice<RmqOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://admin:adminpassword@localhost:5672`],
      queue: 'user_queue',
      prefetchCount: 1,
      persistent: true,
      queueOptions: {
        durable: true,
      },
      socketOptions: {
        heartbeatIntervalInSeconds: 60,
        reconnectTimeInSeconds: 5,
      },
    },
  });
  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Real Estate Management API')
    .setDescription(
      'The Real Estate Management API is a RESTful API for managing real estate data.',
    )
    .setVersion('1.0')
    .addTag('real-estate')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  SwaggerModule.setup('swagger', app, documentFactory, {
    jsonDocumentUrl: 'swagger/json',
  });
  // Enable versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });
  // enable cors for all routes
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept',
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
