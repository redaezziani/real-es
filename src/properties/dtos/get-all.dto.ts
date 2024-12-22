//get-all.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetAllPropertyDto {
  @ApiProperty({ required: false, default: '1' })
  @IsOptional()
  @IsString()
  page: string = '1';

  @ApiProperty({ required: false, default: '10' })
  @IsOptional()
  @IsString()
  limit: string = '10';

  @ApiProperty({ required: false, default: '' })
  @IsOptional()
  @IsString()
  filter: string = '';
}
