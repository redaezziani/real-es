import { IsString, IsNotEmpty } from 'class-validator';

export class CreateBookmarkDto {
  @IsString()
  @IsNotEmpty()
  mangaId: string;
}
