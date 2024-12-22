import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dtos/create.dto';
import { GetAllPropertyDto } from './dtos/get-all.dto';
import { RedisService } from 'src/redis/redis.service';
import { GetByIdPropertyDto } from './dtos/get-by-id.dto';
import { DeletePropertyDto } from './dtos/delete.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
@Injectable()
export class PropertiesService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private cloudinaryService: CloudinaryService,
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

      const key = `properties:${JSON.stringify(getAllDto)}`;
      const cachedProperties = await this.redisService.get(key);

      if (cachedProperties) {
        return JSON.parse(cachedProperties);
      }

      const properties = await this.prisma.properties.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          OR: [
            { name: { contains: filter, mode: 'insensitive' } },
            { description: { contains: filter, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          currency: true,
          location: true,
          type: true,

          images: {
            select: {
              url: true,
            },
          },
          profile: {
            select: {
              id: true,
              role: true,
              image: true,
              bio: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

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

  async uploadPropertyImages(propertyId: string, files: Express.Multer.File[]) {
    const property = await this.prisma.properties.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    const uploadResults = await Promise.all(
      files.map((file) =>
        this.cloudinaryService.uploadImage(file, 'properties'),
      ),
    );

    const imageRecords = uploadResults.map((result) => ({
      url: result.secure_url,
      propertyId,
    }));

    return await this.prisma.propertiesImages.createMany({
      data: imageRecords,
    });
  }
}
