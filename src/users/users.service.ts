import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { SearchUsersDto } from './dtos/search-users.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ...existing code...

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
    file?: Express.Multer.File,
  ) {
    try {
      let imageUrl: string | undefined;

      if (file) {
        const uploadResult = await this.cloudinaryService.uploadFromBuffer(
          file.buffer,
          'user-profiles',
        );
        imageUrl = uploadResult.secure_url;
      }

      const updatedUser = await this.prisma.$transaction(async (prisma) => {
        // Update user name if provided
        if (updateProfileDto.name) {
          await prisma.users.update({
            where: { id: userId },
            data: { name: updateProfileDto.name },
          });
        }

        // Update profile
        return await prisma.profiles.update({
          where: { userId },
          data: {
            bio: updateProfileDto.bio,
            ...(imageUrl && { image: imageUrl }),
          },
        });
      });

      return updatedUser;
    } catch (error) {
      throw new BadRequestException(
        `Failed to update profile: ${error.message}`,
      );
    }
  }

  async findAll(searchDto: SearchUsersDto) {
    try {
      const { page = 1, limit = 10, search, role } = searchDto;
      const skip = (page - 1) * limit;

      const where: Prisma.UsersWhereInput = {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          role
            ? {
                profile: {
                  role: {
                    name: role,
                  },
                },
              }
            : {},
        ],
      };

      const [users, total] = await Promise.all([
        this.prisma.users.findMany({
          where,
          skip,
          take: limit,
          include: {
            profile: {
              include: {
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.users.count({ where }),
      ]);

      return {
        data: users,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch users: ${error.message}`);
    }
  }

  async findOne(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      include: {
        profile: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async deleteUser(id: string) {
    try {
      const user = await this.prisma.users.delete({
        where: { id },
      });
      return { message: 'User deleted successfully', user };
    } catch (error) {
      throw new BadRequestException(`Failed to delete user: ${error.message}`);
    }
  }

  async updateUserRole(userId: string, roleId: string) {
    try {
      const updatedProfile = await this.prisma.profiles.update({
        where: { userId },
        data: { roleId },
        include: {
          role: true,
        },
      });

      return updatedProfile;
    } catch (error) {
      throw new BadRequestException(
        `Failed to update user role: ${error.message}`,
      );
    }
  }
}
