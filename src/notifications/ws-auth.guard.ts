import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

interface UserPayload {
  sub: string; // User ID
  email: string;
  role: string;
  iat: number;
  exp: number;
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn('No token found in headers or query');
        throw new WsException('Unauthorized access');
      }

      // Remove quotes if they exist
      const cleanToken = token.replace(/^["'](.+)["']$/, '$1');

      const payload =
        await this.jwtService.verifyAsync<UserPayload>(cleanToken);
      this.logger.debug(`Token payload: ${JSON.stringify(payload)}`);

      client['user'] = payload;
      return true;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        this.logger.warn('Token expired:', err.message);
      } else {
        this.logger.error('Authentication failed:', err.message, err.stack);
      }
      throw new WsException('Unauthorized access');
    }
  }

  private extractToken(client: Socket): string | undefined {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer') return token;
    }

    const queryToken = client.handshake.query.auth_token;
    if (queryToken) {
      return Array.isArray(queryToken) ? queryToken[0] : queryToken;
    }

    return undefined;
  }
}
