import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../shared/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, PrismaService, CloudinaryService],
  exports: [UsersService],
})
export class UsersModule {}
