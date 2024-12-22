import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class IsAdminMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('No token provided');
      }

      const token = authHeader.split(' ')[1];
      const decoded = await this.jwtService.verifyAsync(token);

      req['user'] = decoded;

      const isAdmin = decoded.role === 'ADMIN';

      if (!isAdmin) {
        throw new UnauthorizedException('Only admins can access this resource');
      }

      next();
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
