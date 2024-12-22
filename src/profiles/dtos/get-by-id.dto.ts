// get-by-id.dto.ts
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetByIdDto {
  @ApiProperty({
    description: 'The ID of the profile to retrieve',
    example: 1,
  })
  @IsString({ message: 'Invalid profile ID' })
  id: string;
}
