import { IsString, IsNotEmpty } from 'class-validator';

export class CreateLikedMangaDto {
  @IsString()
  @IsNotEmpty()
  mangaId: string;
}
