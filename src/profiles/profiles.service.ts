import { DeleteProfileDto } from './dtos/delete.dto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma.service';
import { CreateProfileDto } from './dtos/create.dto';
import { GetByIdDto } from './dtos/get-by-id.dto';
import {
  UpdateProfileBodyDto,
  UpdateProfileParamsDto,
} from './dtos/update.dto';
@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}
  async createProfile(data: CreateProfileDto) {
    return await this.prisma.profiles.create({ data });
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
    return await this.prisma.profiles.update({
      where: { id: params.profileId },
      data,
    });
  }

  async deleteProfile(data: DeleteProfileDto) {
    return await this.prisma.profiles.delete({ where: { id: data.id } });
  }
}
