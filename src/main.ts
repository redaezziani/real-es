import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VersioningType, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { Transport } from '@nestjs/microservices';
import * as logger from 'morgan';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });
  // Move cookie-parser before other middleware
  app.use(cookieParser());
  app.use(logger('dev'));
  // add a prefix to all routes
  app.setGlobalPrefix('api');

  // Configure RabbitMQ connection with logging
  const microservice = app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://admin:adminpassword@localhost:5672'],
      queue: 'manga_queue',
      prefetchCount: 1,
      persistent: true,
      queueOptions: {
        durable: true,
      },
      noAck: true, // Change to true for auto-acknowledgment
      timeout: 30000,
    },
  });

  // Add connection logging
  microservice
    .listen()
    .then(() => {
      console.log('Microservice is listening');
    })
    .catch((err) => {
      console.error('Microservice failed to start:', err);
    });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Manga API Documentation')
    .setDescription('API documentation for the Manga Management System')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for references
    )
    .addServer('http://localhost:8000', 'Local environment') // Add this line
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'Manga API Docs',
  });

  // Enable versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });
  // enable cors for all routes
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true, // Important for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Enable automatic transformation
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit conversions
      },
    }),
  );

  //   await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
