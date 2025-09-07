import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';


export class PublishMangaDto {
  @ApiProperty({
    description: 'ID of the manga to be published',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  mangaId: string;

  @ApiProperty({
    description: 'Flag indicating whether to publish or unpublish the manga',
    example: true,
  })
  @IsBoolean()
  publish: boolean;
}