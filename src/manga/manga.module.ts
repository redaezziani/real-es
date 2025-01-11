import { Module } from '@nestjs/common';
import { MangaService } from './manga.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MangaController } from './manga.controller';
import { RedisService } from 'src/redis/redis.service';

@Module({
  controllers: [MangaController],
  providers: [MangaService, PrismaService, RedisService],
})
export class MangaModule {}
