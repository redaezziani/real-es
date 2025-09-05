import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class BookmarkAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    console.log(
      'BookmarkAuthGuard: Extracted token:',
      token ? 'EXISTS' : 'MISSING',
    );

    if (!token) {
      console.log('BookmarkAuthGuard: No token found');
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      console.log('BookmarkAuthGuard: Token payload:', payload);
      request['user'] = payload;
      return true;
    } catch (error) {
      console.log(
        'BookmarkAuthGuard: Token verification failed:',
        error.message,
      );
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers['authorization'];
    console.log('BookmarkAuthGuard: Authorization header:', authHeader);
    const [type, token] = authHeader?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
