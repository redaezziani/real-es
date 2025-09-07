import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { WebSocketModule } from '../shared/websocket/websocket.module';

@Module({
  imports: [WebSocketModule],
  controllers: [TestController],
})
export class TestModule {}
