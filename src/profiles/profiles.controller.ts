import { DeleteProfileDto } from './dtos/delete.dto';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dtos/create.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CreateDefaultProfileDto } from './dtos/create-default';
import {
  ApiConsumes,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Users } from '@prisma/client';
import {
  UpdateProfileDto,
  UpdateProfileImageDto,
} from './dtos/update-profile.dto';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Profiles')
@ApiBearerAuth('JWT-auth') // Add this decorator - must match the name in main.ts
@UseGuards(JwtAuthGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  async createProfile(@Body() createProfileDto: CreateProfileDto) {
    try {
      return await this.profilesService.createProfile(createProfileDto);
    } catch (error) {
      return error;
    }
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@GetUser() user: Users) {
    return this.profilesService.getProfile(user.id);
  }

  @Delete(':id')
  async deleteProfile(@Param() deleteProfileDto: DeleteProfileDto) {
    try {
      return await this.profilesService.deleteProfile(deleteProfileDto);
    } catch (error) {
      return error;
    }
  }

  @EventPattern('profile.default.create')
  async handleProfileCreate(
    @Payload() createDefaultProfileDto: CreateDefaultProfileDto,
  ) {
    return await this.profilesService.createDefaultProfile(
      createDefaultProfileDto,
    );
  }

  @Patch('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpg|jpeg|png)$/)) {
          cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Update profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Profile image updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  @ApiBody({
    type: UpdateProfileImageDto,
    description: 'Profile image upload',
  })
  async updateProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: Users,
  ) {
    return this.profilesService.updateProfileImage(user.id, file);
  }

  @Patch('me')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpg|jpeg|png)$/)) {
        cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @GetUser() user: Users,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.profilesService.updateProfile(user.id, updateProfileDto, file);
  }
}
