// delete.dto.ts
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteProfileDto {
  @ApiProperty({
    description: 'The ID of the profile to delete',
    example: 1,
  })
  @ApiProperty({
    description: 'The ID of the profile to delete',
    example: 1,
  })
  @IsString({ message: 'Invalid profile ID' })
  id: string;
}
