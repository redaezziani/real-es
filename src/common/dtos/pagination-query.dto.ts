import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @ApiProperty({
    description: 'Page number',
    default: 1,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    default: 10,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit: number = 10;

  @ApiProperty({
    description: 'Search term',
    required: false,
  })
  @IsString()
  @IsOptional()
  search: string = '';
}
