import { timingSafeEqual } from 'node:crypto';
import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class SpotWriteGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header('x-spot-write-key');
    const expected = this.config.getOrThrow<string>('SPOT_WRITE_KEY');
    if (
      !provided ||
      Buffer.byteLength(provided) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
    ) {
      throw new UnauthorizedException(
        'A valid spot management key is required',
      );
    }
    return true;
  }
}
