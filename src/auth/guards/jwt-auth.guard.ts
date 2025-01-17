import {
  Injectable,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndMerge('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic && isPublic.length > 0) {
      return true;
    }

    try {
      const request = context.switchToHttp().getRequest();
      this.logger.debug(
        `Authorization header: ${request.headers.authorization}`,
      );

      const result = await super.canActivate(context);
      const user = request.user;

      this.logger.debug(
        `Authentication result: ${result}, User: ${JSON.stringify(user)}`,
      );

      if (!user?.id) {
        throw new UnauthorizedException('Invalid token or user not found');
      }

      return true;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      throw new UnauthorizedException(
        'Authentication failed: ' + error.message,
      );
    }
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      this.logger.error(
        `JWT validation failed: ${err?.message || 'No user found'}`,
      );
      throw err || new UnauthorizedException('Authentication failed');
    }
    return user;
  }
}
