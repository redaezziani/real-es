// scraper.interface.ts
export interface Manga {
  title: string;
  otherTitles: string[];
  description: string;
  cover: string;
  authors: string[];
  artists: string[];
  type: string;
  releaseDate: string;
  status: string;
  genres: string[];
}

export interface Chapter {
  title: string;
  number: number;
  releaseDate: Date;
  pages: string[];
}

export interface IScraper {
  getManga(title: string): Promise<Manga>;
  getChapter(slug: string, chapterNumber: string): Promise<Chapter>;
}
