import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

// search query
export class AutoCompleteDto {
  @ApiProperty({
    description: 'Search string',
    example: 'One',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  search: string;
}
