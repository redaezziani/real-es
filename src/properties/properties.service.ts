import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dtos/create.dto';
import { GetAllPropertyDto } from './dtos/get-all.dto';
import { RedisService } from 'src/redis/redis.service';
import { GetByIdPropertyDto } from './dtos/get-by-id.dto';
import { DeletePropertyDto } from './dtos/delete.dto';
@Injectable()
export class PropertiesService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}
  async createProperty(createPropertyDto: CreatePropertyDto) {
    try {
      return await this.prisma.properties.create({
        data: createPropertyDto,
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async getAllProperties(getAllDto: GetAllPropertyDto) {
    try {
      const page = parseInt(getAllDto.page, 10) || 1;
      const limit = parseInt(getAllDto.limit, 10) || 10;
      const filter = getAllDto.filter || '';

      // Redis cache key
      const key = `properties:${JSON.stringify(getAllDto)}`;
      const cachedProperties = await this.redisService.get(key);

      if (cachedProperties) {
        return JSON.parse(cachedProperties);
      }

      // Prisma query
      const properties = await this.prisma.properties.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          OR: [
            { name: { contains: filter, mode: 'insensitive' } },
            { description: { contains: filter, mode: 'insensitive' } },
          ],
        },
      });

      // Cache results in Redis
      await this.redisService.set(key, JSON.stringify(properties));
      await this.redisService.expire(key, 60);

      return properties;
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw new Error(error.message);
    }
  }

  async getPropertyById(getById: GetByIdPropertyDto) {
    try {
      // Redis cache key
      const key = `property:${getById.id}`;
      const cachedProperty = await this.redisService.get(key);

      if (cachedProperty) {
        return JSON.parse(cachedProperty);
      }

      const property = await this.prisma.properties.findUnique({
        where: {
          id: getById.id,
        },
      });

      if (property) {
        await this.redisService.set(key, JSON.stringify(property));
        await this.redisService.expire(key, 60);
      }

      return property;
    } catch (error) {
      throw new Error(error);
    }
  }

  async deleteProperty(deleteDto: DeletePropertyDto) {
    try {
      return await this.prisma.properties.delete({
        where: {
          id: deleteDto.id,
        },
      });
    } catch (error) {
      throw new Error(error);
    }
  }
}
