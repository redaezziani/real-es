import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsUrl } from 'class-validator';

export class MangaNotificationDto {
  @IsString()
  id: string;

  @IsEnum(['new_manga', 'new_chapter'])
  type: 'new_manga' | 'new_chapter';

  @IsString()
  mangaId: string;

  @IsString()
  mangaTitle: string;

  @IsOptional()
  @IsString()
  mangaSlug?: string;

  @IsOptional()
  @IsNumber()
  chapterNumber?: number;

  @IsOptional()
  @IsString()
  chapterTitle?: string;

  @IsOptional()
  @IsString()
  chapterId?: string;

  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @IsDateString()
  timestamp: Date;

  @IsString()
  message: string;
}

export class SubscribeToMangaDto {
  @IsString()
  mangaId: string;
}

export class UnsubscribeFromMangaDto {
  @IsString()
  mangaId: string;
}
