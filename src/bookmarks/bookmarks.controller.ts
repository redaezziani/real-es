import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { GetBookmarksQueryDto } from './dto/get-bookmarks-query.dto';
import { BookmarkAuthGuard } from './guards/auth.guard';

@Controller('bookmarks')
@UseGuards(BookmarkAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  async createBookmark(
    @Body() createBookmarkDto: CreateBookmarkDto,
    @Request() req,
  ) {
    const userId = req.user.sub;
    return this.bookmarksService.createBookmark(
      userId,
      createBookmarkDto.mangaId,
    );
  }

  @Delete(':mangaId')
  async removeBookmark(@Param('mangaId') mangaId: string, @Request() req) {
    const userId = req.user.sub;
    return this.bookmarksService.removeBookmark(userId, mangaId);
  }

  @Get()
  async getUserBookmarks(@Request() req, @Query() query: GetBookmarksQueryDto) {
    const userId = req.user.sub;
    return this.bookmarksService.getUserBookmarks(userId, query);
  }

  @Get('check/:mangaId')
  async isBookmarked(@Param('mangaId') mangaId: string, @Request() req) {
    try {
      console.log('Checking bookmark status for manga:', mangaId);
      console.log('User from request:', req.user);
      const userId = req.user.sub;
      console.log('User ID:', userId);
      const isBookmarked = await this.bookmarksService.isBookmarked(
        userId,
        mangaId,
      );
      console.log('Bookmark status result:', isBookmarked);
      return { bookmarked: isBookmarked };
    } catch (error) {
      console.error('Error in isBookmarked controller:', error);
      throw error;
    }
  }

  @Post('toggle/:mangaId')
  async toggleBookmark(@Param('mangaId') mangaId: string, @Request() req) {
    const userId = req.user.sub;
    return this.bookmarksService.toggleBookmark(userId, mangaId);
  }
}
