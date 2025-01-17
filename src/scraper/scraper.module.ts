import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/shared/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ScraperFactory } from './scraper.factory';
import { AsheqScraperRepository } from './repository/asheq.repository';
import { AresScraperRepository } from './repository/ares.repository';
import { ClientsModule } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import { ScraperController } from './scraper.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'manga_service',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:adminpassword@localhost:5672'],
          queue: 'manga_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
    NotificationsModule,
  ],
  providers: [
    ScraperService,
    ScraperFactory,
    CloudinaryService,
    PrismaService,
    AsheqScraperRepository,
    AresScraperRepository,
  ],
  controllers: [ScraperController],
})
export class ScraperModule {}
