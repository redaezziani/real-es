import { Module } from '@nestjs/common';
import { MangaService } from './manga.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MangaController } from './manga.controller';
import { RedisService } from 'src/redis/redis.service';
import { ClientsModule } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import { secrets } from 'src/config/secrets';
import { MangaRecommendationService } from './service/manga.recommendation.service';
import { MangaEvents } from './manga.events';
import { WebSocketModule } from '../shared/websocket/websocket.module';

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
    WebSocketModule,
  ],
  controllers: [MangaController],
  providers: [
    MangaService,
    PrismaService,
    RedisService,
    MangaRecommendationService,
    MangaEvents
  ],
})

export class MangaModule {}
