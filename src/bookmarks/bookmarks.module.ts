import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';
import { BookmarkAuthGuard } from './guards/auth.guard';
import { PrismaService } from '../shared/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [BookmarksController],
  providers: [BookmarksService, BookmarkAuthGuard, PrismaService],
  exports: [BookmarksService],
})
export class BookmarksModule {}
