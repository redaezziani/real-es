import { Test, TestingModule } from '@nestjs/testing';
import { MangaService } from '../manga.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';

describe('MangaService', () => {
  let service: MangaService;
  let prismaService: PrismaService;
  let redisService: RedisService;

  const mockPrismaService = {
    manga: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
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
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('all', () => {
    it('should return paginated manga list', async () => {
      const mockQuery: PaginationQueryDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };

      const mockMangas = [{ id: '1', title: 'Test Manga' }];
      mockPrismaService.manga.findMany.mockResolvedValue(mockMangas);
      mockPrismaService.manga.count.mockResolvedValue(1);

      const result = await service.all(mockQuery);

      expect(result.success).toBe(true);
      expect(result.data.items).toEqual(mockMangas);
      expect(result.data.meta.currentPage).toBe(1);
    });
  });

  describe('byId', () => {
    it('should return a single manga', async () => {
      const mockManga = { id: '1', title: 'Test Manga' };
      mockPrismaService.manga.findFirst.mockResolvedValue(mockManga);

      const result = await service.byId('1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockManga);
    });
  });

  describe('getPopularMangas', () => {
    it('should return popular mangas', async () => {
      const mockMangas = [{ id: '1', title: 'Popular Manga' }];
      mockPrismaService.$queryRaw.mockResolvedValue(mockMangas);

      const result = await service.getPopularMangas();

      expect(result).toEqual(mockMangas);
    });
  });

  describe('getMangaByGenre', () => {
    it('should return paginated manga list by genre', async () => {
      const mockQuery: PaginationQueryDto = {
        page: 1,
        limit: 10,
        search: '',
      };

      const mockMangas = [{ id: '1', title: 'Action Manga' }];
      mockPrismaService.manga.findMany.mockResolvedValue(mockMangas);
      mockPrismaService.manga.count.mockResolvedValue(1);

      const result = await service.getMangaByGenre('action', mockQuery);

      expect(result.success).toBe(true);
      expect(result.data.items).toEqual(mockMangas);
      expect(result.data.meta.currentPage).toBe(1);
    });
  });

  describe('autocomplete', () => {
    it('should return cached results if available', async () => {
      const mockCachedResults = ['Manga 1', 'Manga 2'];
      mockRedisService.get.mockResolvedValue(JSON.stringify(mockCachedResults));

      const result = await service.autocomplete({ search: 'test' });

      expect(result).toEqual(mockCachedResults);
      expect(mockRedisService.get).toHaveBeenCalled();
      expect(mockPrismaService.manga.findMany).not.toHaveBeenCalled();
    });

    it('should fetch and cache new results if not cached', async () => {
      mockRedisService.get.mockResolvedValue(null);
      const mockMangas = [
        { title: 'Test Manga', otherTitles: ['Other Title'] },
      ];
      mockPrismaService.manga.findMany.mockResolvedValue(mockMangas);

      const result = await service.autocomplete({ search: 'test' });

      expect(result).toBeDefined();
      expect(mockRedisService.set).toHaveBeenCalled();
    });
  });
});
