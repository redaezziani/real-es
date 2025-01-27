import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { MailService } from './mail.service';

@Global()
@Module({
  providers: [PrismaService, MailService],
  exports: [PrismaService, MailService],
})
export class SharedModule {}
