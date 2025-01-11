import { Test, TestingModule } from '@nestjs/testing';
import { MangaController } from '../manga.controller';
import { MangaService } from '../manga.service';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';
import { HttpException } from '@nestjs/common';

describe('MangaController', () => {
  let controller: MangaController;
  
  const mockMangaService = {
    all: jest.fn(),
    byId: jest.fn(),
    getPopularMangas: jest.fn(),
    getLatestMangas: jest.fn(),
    getMangaByGenre: jest.fn(),
    autocomplete: jest.fn(),
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
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('all', () => {
    it('should return paginated manga list', async () => {
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

      const query: PaginationQueryDto = {
        page: 1,
        limit: 10,
        search: '',
      };

      const result = await controller.all(query);
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors', async () => {
      const errorMessage = 'Test error';
      // Mock service to return a rejected promise
      mockMangaService.all.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      const query: PaginationQueryDto = {
        page: 1,
        limit: 10,
        search: '',
      };

      try {
        await controller.all(query);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.response).toEqual({
          success: false,
          message: errorMessage,
        });
        expect(error.status).toBe(400); // Check for BAD_REQUEST status
      }
    });
  });

  describe('getMangasByGenre', () => {
    it('should return mangas by genre', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [{ id: '1', title: 'Action Manga' }],
          meta: {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 1,
            totalPages: 1,
          },
        },
      };

      mockMangaService.getMangaByGenre.mockResolvedValue(mockResponse);

      const query: PaginationQueryDto = {
        page: 1,
        limit: 10,
        search: '',
      };

      const result = await controller.getMangasByGenre('action', query);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('autocomplete', () => {
    it('should return autocomplete results', async () => {
      const mockResults = ['Manga 1', 'Manga 2'];
      mockMangaService.autocomplete.mockResolvedValue(mockResults);

      const result = await controller.autocomplete({ search: 'test' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResults);
    });

    it('should handle empty search query', async () => {
      const result = await controller.autocomplete({ search: '' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });
});
