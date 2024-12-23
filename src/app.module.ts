import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerModule } from './shared/logger.module';
import { PropertiesModule } from './properties/properties.module';
import { ProfilesModule } from './profiles/profiles.module';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
    PropertiesModule,
    ProfilesModule,
    AuthModule,
    CloudinaryModule,
    RedisModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
