import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class GetLikedMangaQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
