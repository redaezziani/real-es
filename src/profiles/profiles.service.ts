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
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

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

  async getProfile(userId: string) {
    return this.prisma.profiles.findUnique({
      where: { userId },
      include: {
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
    userId: string, 
    updateProfileDto: UpdateProfileDto, 
    file?: Express.Multer.File
  ) {
    try {
      let imageUrl: string | undefined;

      if (file) {
        const uploadResult = await this.cloudinary.uploadFromBuffer(
          file.buffer,
          'profile-images'
        );
        imageUrl = uploadResult.secure_url;
      }

      return await this.prisma.profiles.update({
        where: { userId },
        data: {
          ...updateProfileDto,
          ...(imageUrl && { image: imageUrl }),
        },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to update profile: ${error.message}`);
    }
  }

  async updateProfileImage(userId: string, file: Express.Multer.File) {
    const imageUrl = await this.cloudinary.uploadFromBuffer(
      file.buffer,
      'profile-images'
    );

    return this.prisma.profiles.update({
      where: { userId },
      data: {
        image: imageUrl.secure_url,
      },
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
