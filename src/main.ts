import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { RmqOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VersioningType, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // add a prefix to all routes
  app.setGlobalPrefix('api');
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://admin:adminpassword@localhost:5672'],
      queue: 'crawler_queue',
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
    origin: 'http://localhost:3000',
    credentials: true, // Important for cookies
  });
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Enable automatic transformation
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit conversions
      },
    }),
  );

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
