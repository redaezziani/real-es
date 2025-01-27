import { Manga } from '@prisma/client';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';
import {
  PaginatedResponse,
  SingleResponse,
} from '../common/types/api-response.type';
import { AutoCompleteDto } from './dtos/auto-complet';

export interface IManga {
  getPopularMangas(): Promise<Manga[]>;
  getLatestMangas(): Promise<Manga[]>;
  getMangaByGenre(
    genre: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Manga>>;
  all(query: PaginationQueryDto): Promise<PaginatedResponse<Manga>>;
  byId(id: string): Promise<SingleResponse<Manga>>;
  autocomplete(search: AutoCompleteDto): Promise<string[]>;
}
