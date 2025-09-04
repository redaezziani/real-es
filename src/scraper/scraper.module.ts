import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/shared/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ScraperFactory } from './scraper.factory';
import { AsheqScraperRepository } from './repository/asheq.repository';
import { AresScraperRepository } from './repository/ares.repository';
import { LekmangaScraperRepository } from './repository/lekmanga.repository';
import { ClientsModule } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import { ScraperController } from './scraper.controller';
import { secrets } from 'src/config/secrets';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'manga_service',
        transport: Transport.RMQ,
        options: {
          urls: [secrets.rabbitmq.url],
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
    LekmangaScraperRepository,
  ],
  controllers: [ScraperController],
})
export class ScraperModule {}
