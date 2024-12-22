import { GetByIdPropertyDto } from './dtos/get-by-id.dto';
import { CreatePropertyDto } from './dtos/create.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { GetAllPropertyDto } from './dtos/get-all.dto';
import { DeletePropertyDto } from './dtos/delete.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadPropertyImagesDto } from './dtos/upload-images.dto';
import { ApiConsumes } from '@nestjs/swagger';
@Controller('properties')
export class PropertiesController {
  constructor(private readonly service: PropertiesService) {}

  @Post()
  async createProperty(@Body() createPropertyDto: CreatePropertyDto) {
    try {
      return await this.service.createProperty(createPropertyDto);
    } catch (error) {
      throw new Error(error);
    }
  }
  @Get()
  async getAllProperties(@Query() getAllDto: GetAllPropertyDto) {
    try {
      const properties = await this.service.getAllProperties(getAllDto);
      return properties;
    } catch (error) {
      throw new Error(error);
    }
  }
  @Get(':id')
  async getPropertyById(@Query() getByIdDto: GetByIdPropertyDto) {
    try {
      const property = await this.service.getPropertyById(getByIdDto);
      return property;
    } catch (error) {
      throw new Error(error);
    }
  }

  @Delete(':id')
  async deleteProperty(@Query() deleteDto: DeletePropertyDto) {
    try {
      return await this.service.deleteProperty(deleteDto);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Post('upload-images')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadPropertyImages(
    @Body() uploadPropertyImagesDto: UploadPropertyImagesDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    try {
      return await this.service.uploadPropertyImages(
        uploadPropertyImagesDto.propertyId,
        files,
      );
    } catch (error) {
      throw new Error(error);
    }
  }
}
