import { MangaService } from './manga.service';
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Manga } from '@prisma/client';
import { AutoCompleteDto } from './dtos/auto-complet';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';
import {
  PaginatedResponse,
  SingleResponse,
} from 'src/common/types/api-response.type';
import { MangaQueryDto } from './dtos/manga-query.dto';
import { ChapterPageDto } from './dtos/chapter-pages.dto';
import { GetMangaDto } from './dtos/get-manga';
import { GetChapterDto } from './dtos/get-chapter';
import { ClientProxy } from '@nestjs/microservices';

@ApiTags('manga')
@Controller('manga')
export class MangaController {
  constructor(
    private readonly mangaService: MangaService,
    @Inject('manga_service') private readonly client: ClientProxy,
  ) {}

  @Get('popular')
  async getPopularMangas(): Promise<Manga[]> {
    try {
      const mangas = await this.mangaService.getPopularMangas();
      return mangas;
    } catch (error) {
      throw new Error(error);
    }
  }

  @Get('latest')
  async getLatestMangas(): Promise<Manga[]> {
    try {
      const mangas = await this.mangaService.getLatestMangas();
      return mangas;
    } catch (error) {
      throw new Error(error);
    }
  }

  @Get('genre/:genre')
  @ApiResponse({
    status: 200,
    description: 'List of mangas by genre with pagination',
  })
  async getMangasByGenre(
    @Param('genre') genre: string,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Manga>> {
    try {
      return await this.mangaService.getMangaByGenre(genre, query);
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('all')
  @ApiResponse({
    status: 200,
    description: 'List of mangas with pagination and filters',
  })
  async all(@Query() query: MangaQueryDto) {
    try {
      return this.mangaService.all(query);
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('search/autocomplete')
  async autocomplete(@Query() query: AutoCompleteDto): Promise<any> {
    try {
      if (!query.search) {
        return {
          success: true,
          data: [],
          message: 'No search term provided',
        };
      }

      const results = await this.mangaService.autocomplete(query);

      return {
        success: true,
        data: results,
        query: query.search,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/info/:id')
  @ApiResponse({ status: 200, description: 'Single manga details' })
  async byId(@Param('id') id: string) {
    return this.mangaService.byId(id);
  }
  // get the pages of a chapter
  @Get('/manga/:id/chapter/:chapter')
  @ApiResponse({
    status: 200,
    description: 'Get the pages of a chapter',
    type: ChapterPageDto,
  })
  async getChapterPages(
    @Param('id') id: string,
    @Param('chapter') chapter: string,
  ): Promise<SingleResponse<ChapterPageDto>> {
    return this.mangaService.getChapterPages(id, chapter);
  }

  @Get('status')
  async getStatus(): Promise<string[]> {
    return this.mangaService.getStatus();
  }
  @Get('genres')
  async getGenres(): Promise<string[]> {
    return this.mangaService.getGenres();
  }
  @Get('types')
  async getTypes(): Promise<string[]> {
    return this.mangaService.getTypes();
  }
  @Post('')
  async getManga(@Query() getMangaDto: GetMangaDto) {
    try {
      this.client.emit('scraper.manga.create', getMangaDto);

      return {
        statusCode: HttpStatus.ACCEPTED,
        message: 'Manga scraping request has been queued',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('')
  async getChapter(@Query() getChapterDto: GetChapterDto) {
    // Emit event instead of sending message
    this.client.emit('scraper.chapter.create', getChapterDto);

    return {
      statusCode: HttpStatus.ACCEPTED,
      message: 'Chapter scraping request has been queued',
      timestamp: new Date().toISOString(),
    };
  }
}
