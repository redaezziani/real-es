import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';


export class PublishChapterDto {
  @ApiProperty({
    description: 'ID of the chapter to be published',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  chapterId: string;

  @ApiProperty({
    description: 'Flag indicating whether to publish or unpublish the chapter',
    example: true,
  })
  @IsBoolean()
  publish: boolean;
}