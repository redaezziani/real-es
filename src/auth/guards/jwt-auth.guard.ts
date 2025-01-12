import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable, firstValueFrom } from 'rxjs';

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

    if (isPublic) {
      return true;
    }

    try {
      const activationResult = super.canActivate(context);
      const request = context.switchToHttp().getRequest();

      let result: boolean;
      if (activationResult instanceof Observable) {
        result = await firstValueFrom(activationResult);
      } else if (activationResult instanceof Promise) {
        result = await activationResult;
      } else {
        result = activationResult as boolean;
      }
      
      this.logger.debug(`Auth result: ${result}, User: ${JSON.stringify(request.user)}`);
      
      if (!request.user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }

      return result;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      this.logger.error(`JWT validation failed: ${err?.message || 'No user found'}`);
      throw err || new UnauthorizedException('Authentication failed');
    }
    return user;
  }
}
