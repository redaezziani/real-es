import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MangaFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ each: true })
  genres?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ each: true })
  status?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ each: true })
  themes?: string[];
}
