import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LikedMangaController } from './liked-manga.controller';
import { LikedMangaService } from './liked-manga.service';
import { LikedMangaAuthGuard } from './guards/auth.guard';
import { PrismaService } from '../shared/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [LikedMangaController],
  providers: [LikedMangaService, LikedMangaAuthGuard, PrismaService],
  exports: [LikedMangaService],
})
export class LikedMangaModule {}
