import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import type { Request } from 'express';
import { UsersService } from '../users.service.js';
import type { PublicUser } from '../user-view.js';

export interface AuthenticatedRequest extends Request {
  user: PublicUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const parts = request.header('authorization')?.split(' ');
    if (
      !parts ||
      parts.length !== 2 ||
      parts[0].toLowerCase() !== 'bearer' ||
      !parts[1]
    ) {
      throw new UnauthorizedException('A valid bearer token is required');
    }
    let payload: { sub?: unknown };
    try {
      payload = await this.jwt.verifyAsync<{ sub?: unknown }>(parts[1]);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    if (typeof payload.sub !== 'string' || !isUUID(payload.sub))
      throw new UnauthorizedException('Invalid token');
    const user = await this.users.findPublicUserById(payload.sub);
    if (!user) throw new UnauthorizedException('User no longer exists');
    request.user = user;
    return true;
  }
}
