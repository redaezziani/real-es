import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { MailService } from './mail.service';
import { WebSocketModule } from './websocket/websocket.module';

@Global()
@Module({
  imports: [WebSocketModule],
  providers: [PrismaService, MailService],
  exports: [PrismaService, MailService, WebSocketModule],
})
export class SharedModule {}
