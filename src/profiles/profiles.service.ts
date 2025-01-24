import { DeleteProfileDto } from './dtos/delete.dto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma.service';
import { CreateProfileDto } from './dtos/create.dto';
import { GetByIdDto } from './dtos/get-by-id.dto';
import {
  UpdateProfileBodyDto,
  UpdateProfileParamsDto,
} from './dtos/update.dto';
import { CreateDefaultProfileDto } from './dtos/create-default';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(data: CreateProfileDto) {
    return await this.prisma.profiles.create({
      data: {
        bio: data.bio,
        phone: data.phone,
        image: data.image,
        user: {
          connect: { id: data.userId },
        },
        role: {
          connect: { id: data.roleId },
        },
      },
    });
  }

  async getProfile(data: GetByIdDto) {
    return await this.prisma.profiles.findUnique({
      where: { id: data.id },
      select: {
        id: true,
        image: true,
        badge: true,
        bio: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async updateProfile(
    params: UpdateProfileParamsDto,
    data: UpdateProfileBodyDto,
  ) {
    const updateData: any = {};
    if (data.bio) updateData.bio = data.bio;
    if (data.phone) updateData.phone = data.phone;
    if (data.image) updateData.image = data.image;

    return await this.prisma.profiles.update({
      where: { id: params.profileId },
      data: updateData,
    });
  }

  async deleteProfile(data: DeleteProfileDto) {
    return await this.prisma.profiles.delete({ where: { id: data.id } });
  }

  async createDefaultProfile(createDefaultProfile: CreateDefaultProfileDto) {
    // Get or create default USER role
    let defaultRole = await this.prisma.role.findFirst({
      where: { name: 'USER' },
    });

    if (!defaultRole) {
      try {
        defaultRole = await this.prisma.role.create({
          data: {
            name: 'USER',
            description: 'Default user role with basic permissions',
          },
        });
      } catch (error) {
        // In case of race condition, try to fetch again
        defaultRole = await this.prisma.role.findFirst({
          where: { name: 'USER' },
        });

        if (!defaultRole) {
          throw new BadRequestException(
            'Failed to create or find default USER role. Please contact administrator.',
          );
        }
      }
    }

    return await this.prisma.profiles.create({
      data: {
        user: {
          connect: { id: createDefaultProfile.userId },
        },
        role: {
          connect: { id: defaultRole.id },
        },
      },
    });
  }
}
