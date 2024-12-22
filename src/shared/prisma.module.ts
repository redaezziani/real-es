// src/shared/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Makes PrismaModule globally available
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
