import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractToken(client);
      this.logger.debug('Extracted token:', token);

      if (!token) {
        this.logger.warn('No token found in headers or query');
        throw new WsException('Unauthorized access');
      }

      // Remove quotes if they exist
      const cleanToken = token.replace(/^["'](.+)["']$/, '$1');
      
      const payload = await this.jwtService.verifyAsync(cleanToken);
      this.logger.debug('Token payload:', payload);
      
      client['user'] = payload;
      return true;
    } catch (err) {
      this.logger.error('Authentication error:', err);
      throw new WsException('Unauthorized access');
    }
  }

  private extractToken(client: Socket): string | undefined {
    this.logger.debug('Checking headers:', client.handshake.headers);
    this.logger.debug('Checking query:', client.handshake.query);
    
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
