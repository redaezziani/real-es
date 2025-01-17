import { Module } from '@nestjs/common';
import { MangaService } from './manga.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MangaController } from './manga.controller';
import { RedisService } from 'src/redis/redis.service';
import { ClientsModule } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
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
  ],
  controllers: [MangaController],
  providers: [MangaService, PrismaService, RedisService],
})
export class MangaModule {}
