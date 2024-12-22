import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Module({
  providers: [PropertiesService, CloudinaryService],
  controllers: [PropertiesController],
})
export class PropertiesModule {}
