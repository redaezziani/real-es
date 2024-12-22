import {
  UpdateProfileParamsDto,
  UpdateProfileBodyDto,
} from './dtos/update.dto';
import { DeleteProfileDto } from './dtos/delete.dto';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dtos/create.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { GetByIdDto } from './dtos/get-by-id.dto';
@Controller({ path: 'profiles', version: '1' })
export class ProfilesController {
  constructor(private readonly service: ProfilesService) {}
  @Post()
  async createProfile(@Body() createProfileDto: CreateProfileDto) {
    try {
      return await this.service.createProfile(createProfileDto);
    } catch (error) {
      return error;
    }
  }
  @Get(':id')
  async getProfile(@Param() getByIdDto: GetByIdDto) {
    try {
      return await this.service.getProfile(getByIdDto);
    } catch (error) {
      return error;
    }
  }

  @Put(':id')
  async updateProfile(
    @Param() updateProfileParamsDto: UpdateProfileParamsDto,
    @Body() updateProfileBodyDto: UpdateProfileBodyDto,
  ) {
    try {
      return await this.service.updateProfile(
        updateProfileParamsDto,
        updateProfileBodyDto,
      );
    } catch (error) {
      return error;
    }
  }

  @Delete(':id')
  async deleteProfile(@Param() deleteProfileDto: DeleteProfileDto) {
    try {
      return await this.service.deleteProfile(deleteProfileDto);
    } catch (error) {
      return error;
    }
  }
}
