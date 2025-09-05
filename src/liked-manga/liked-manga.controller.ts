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
import { LikedMangaService } from './liked-manga.service';
import { CreateLikedMangaDto } from './dto/create-liked-manga.dto';
import { GetLikedMangaQueryDto } from './dto/get-liked-manga-query.dto';
import { LikedMangaAuthGuard } from './guards/auth.guard';

@Controller('liked-manga')
@UseGuards(LikedMangaAuthGuard)
export class LikedMangaController {
  constructor(private readonly likedMangaService: LikedMangaService) {}

  @Post()
  async likeManga(
    @Body() createLikedMangaDto: CreateLikedMangaDto,
    @Request() req,
  ) {
    console.log('Received like request:', createLikedMangaDto);
    const userId = req.user.sub;
    return this.likedMangaService.likeManga(
      userId,
      createLikedMangaDto.mangaId,
    );
  }

  @Delete(':mangaId')
  async unlikeManga(@Param('mangaId') mangaId: string, @Request() req) {
    const userId = req.user.sub;
    return this.likedMangaService.unlikeManga(userId, mangaId);
  }

  @Get()
  async getUserLikedManga(
    @Request() req,
    @Query() query: GetLikedMangaQueryDto,
  ) {
    console.log('Fetching liked manga with query:', query);
    const userId = req.user.sub;
    const res = await this.likedMangaService.getUserLikedManga(userId, query);
    console.log('Fetched liked manga:', res);
    return res;
  }

  @Get('check/:mangaId')
  async isLiked(@Param('mangaId') mangaId: string, @Request() req) {
    try {
      console.log('Checking like status for manga:', mangaId);
      console.log('User from request:', req.user);
      const userId = req.user.sub;
      console.log('User ID:', userId);
      const isLiked = await this.likedMangaService.isLiked(userId, mangaId);
      console.log('Like status result:', isLiked);
      return { liked: isLiked };
    } catch (error) {
      console.error('Error in isLiked controller:', error);
      throw error;
    }
  }

  @Post('toggle/:mangaId')
  async toggleLike(@Param('mangaId') mangaId: string, @Request() req) {
    const userId = req.user.sub;
    return this.likedMangaService.toggleLike(userId, mangaId);
  }

  @Get('count/:mangaId')
  async getMangaLikeCount(@Param('mangaId') mangaId: string) {
    const count = await this.likedMangaService.getMangaLikeCount(mangaId);
    return { mangaId, likeCount: count };
  }

  @Get('most-liked')
  async getMostLikedManga(@Query('limit') limit: string = '10') {
    const limitNumber = parseInt(limit, 10) || 10;
    return this.likedMangaService.getMostLikedManga(limitNumber);
  }
}
