import { Test, TestingModule } from '@nestjs/testing';
import { MangaService } from './manga.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('MangaService', () => {
  let service: MangaService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    manga: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MangaService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<MangaService>(MangaService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('all', () => {
    it('should return paginated manga list with filters', async () => {
      const mockMangas = [
        {
          id: '1',
          title: 'Test Manga',
          rating: 4.5,
          genres: ['Action'],
          status: 'Ongoing',
        },
      ];

      mockPrismaService.manga.findMany.mockResolvedValue(mockMangas);
      mockPrismaService.manga.count.mockResolvedValue(1);

      const result = await service.all({
        page: 1,
        limit: 10,
        search: 'test',
        genres: ['Action'],
        status: ['Ongoing'],
        minRating: 4,
      });

      expect(result).toEqual({
        success: true,
        data: {
          items: mockMangas,
          meta: {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 1,
            totalPages: 1,
          },
        },
      });
    });
  });

  describe('byId', () => {
    it('should return manga by id', async () => {
      const mockManga = {
        id: '1',
        title: 'Test Manga',
        chapters: [],
      };

      mockPrismaService.manga.findFirst.mockResolvedValue(mockManga);
      mockPrismaService.manga.update.mockResolvedValue(mockManga);

      const result = await service.byId('1');

      expect(result).toEqual({
        success: true,
        data: mockManga,
      });
    });

    it('should return error when manga not found', async () => {
      mockPrismaService.manga.findFirst.mockResolvedValue(null);

      const result = await service.byId('999');

      expect(result).toEqual({
        success: false,
        message: 'Manga not found',
        data: null,
      });
    });
  });

  describe('autocomplete', () => {
    it('should return cached results if available', async () => {
      const cachedResults = ['Manga 1', 'Manga 2'];
      mockRedisService.get.mockResolvedValue(JSON.stringify(cachedResults));

      const result = await service.autocomplete({ search: 'manga' });

      expect(result).toEqual(cachedResults);
    });

    it('should fetch and cache new results if not cached', async () => {
      mockRedisService.get.mockResolvedValue(null);
      const mockResults = [
        { title: 'Manga 1', otherTitles: ['Other 1'] },
        { title: 'Manga 2', otherTitles: ['Other 2'] },
      ];

      mockPrismaService.manga.findMany.mockResolvedValue(mockResults);

      const result = await service.autocomplete({ search: 'manga' });

      expect(result.length).toBeGreaterThan(0);
      expect(mockRedisService.set).toHaveBeenCalled();
    });
  });
});
