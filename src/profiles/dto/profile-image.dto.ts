import { ApiProperty } from '@nestjs/swagger';

export class ProfileImageDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Profile image file (jpeg/png/jpg)',
    required: true,
  })
  file: Express.Multer.File; // Correct Multer file type
}
