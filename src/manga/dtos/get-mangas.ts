import { ApiProperty } from '@nestjs/swagger';
import { Manga } from '@prisma/client';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class GetMangasDto {
  @ApiProperty({
    description: 'Page number',
    example: '1',
  })
  @IsNotEmpty()
  @IsString()
  page: string;

  @ApiProperty({
    description: 'Limit number',
    example: '10',
  })
  @IsNotEmpty()
  @IsString()
  limit: string;

  @ApiProperty({
    description: 'Search string',
    example: 'One Piece',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  search: string;
}

interface PaginationRes<T> {
  currentPage: number;
  totalPages: number;
  limit: number;
  totalCount: number;
  data: T[];
}

export type GetMangasRes = PaginationRes<Manga>;
