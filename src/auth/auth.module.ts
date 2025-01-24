import { Logger, Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/shared/mail.service';
import { AuthController } from './auth.controller';
import { ClientsModule } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
@Global() // Make the module global
@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
    ClientsModule.register([
      {
        name: 'manga_service',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:adminpassword@localhost:5672'],
          queue: 'manga_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  providers: [AuthService, JwtStrategy, Logger, PrismaService, MailService],
  exports: [AuthService, JwtModule],
  controllers: [AuthController],
})
export class AuthModule {}
