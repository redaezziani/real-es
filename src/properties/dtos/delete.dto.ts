//delete.dto.ts
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeletePropertyDto {
  @ApiProperty({
    description: 'The unique identifier of the property',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'Property id must be a string' })
  id: string;
}
