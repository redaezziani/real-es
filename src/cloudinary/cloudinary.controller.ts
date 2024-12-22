import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folderName') folderName: string,
  ) {
    if (!file) {
      throw new Error('No file provided');
    }
    return this.cloudinaryService.uploadImage(file, folderName);
  }

  @Post('delete')
  async deleteImage(@Query('publicId') publicId: string) {
    return this.cloudinaryService.deleteImage(publicId);
  }
}
