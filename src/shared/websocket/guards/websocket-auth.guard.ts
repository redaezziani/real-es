import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { IWebSocketUser } from '../interfaces/websocket.interface';

@Injectable()
export class WebSocketAuthGuard implements CanActivate {
  private readonly logger = new Logger(WebSocketAuthGuard.name);

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

      const payload = await this.jwtService.verifyAsync<IWebSocketUser>(cleanToken);
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
    // Try to get token from headers first
    const authHeader = client.handshake.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer') return token;
    }

    // If not in headers, try query parameters
    const queryToken = client.handshake.query.auth_token;
    if (queryToken) {
      return Array.isArray(queryToken) ? queryToken[0] : queryToken;
    }

    return undefined;
  }
}
