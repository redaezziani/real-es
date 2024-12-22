import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadPropertyImagesDto {
  @ApiProperty({
    description: 'The ID of the property to associate the images with',
    example: 'property-id',
  })
  @IsNotEmpty()
  @IsString()
  propertyId: string;

  @ApiProperty({
    description: 'Array of images to upload',
    type: 'string',
    format: 'binary',
    isArray: true,
  })
  @IsNotEmpty()
  @IsArray()
  @Type(() => String)
  files: Express.Multer.File[];
}
