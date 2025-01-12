import { Test, TestingModule } from '@nestjs/testing';
import { MangaController } from './manga.controller';
import { MangaService } from './manga.service';

describe('MangaController', () => {
  let controller: MangaController;
  let service: MangaService;

  const mockMangaService = {
    all: jest.fn(),
    byId: jest.fn(),
    getPopularMangas: jest.fn(),
    getLatestMangas: jest.fn(),
    getMangaByGenre: jest.fn(),
    autocomplete: jest.fn(),
    getStatus: jest.fn(),
    getGenres: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MangaController],
      providers: [
        {
          provide: MangaService,
          useValue: mockMangaService,
        },
      ],
    }).compile();

    controller = module.get<MangaController>(MangaController);
    service = module.get<MangaService>(MangaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('all', () => {
    it('should return filtered and paginated manga list', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [{ id: '1', title: 'Test Manga' }],
          meta: {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 1,
            totalPages: 1,
          },
        },
      };

      mockMangaService.all.mockResolvedValue(mockResponse);

      const result = await controller.all({
        page: 1,
        limit: 10,
        search: 'test',
        genres: ['Action'],
        status: ['Ongoing'],
        minRating: 4,
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle errors', async () => {
      mockMangaService.all.mockRejectedValue(new Error('Database error'));

      await expect(controller.all({})).rejects.toThrow();
    });
  });

  describe('getMangasByGenre', () => {
    it('should return mangas filtered by genre', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [{ id: '1', title: 'Test Manga' }],
          meta: {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 1,
            totalPages: 1,
          },
        },
      };

      mockMangaService.getMangaByGenre.mockResolvedValue(mockResponse);

      const result = await controller.getMangasByGenre('Action', {
        page: 1,
        limit: 10,
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('autocomplete', () => {
    it('should return autocomplete results', async () => {
      const mockResults = ['Manga 1', 'Manga 2'];
      mockMangaService.autocomplete.mockResolvedValue(mockResults);

      const result = await controller.autocomplete({ search: 'manga' });

      expect(result).toEqual({
        success: true,
        data: mockResults,
        query: 'manga',
      });
    });

    it('should return empty array when no search term', async () => {
      const result = await controller.autocomplete({ search: '' });

      expect(result).toEqual({
        success: true,
        data: [],
        message: 'No search term provided',
      });
    });
  });
});
