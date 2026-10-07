import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { Prisma } from '../generated/prisma/client.js';
import { UsersService } from './users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import type { PublicUser } from './user-view.js';

const PASSWORD_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly fallbackHash = hash(randomUUID(), PASSWORD_ROUNDS);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // bcrypt silently truncates after 72 bytes, including multibyte characters.
    if (Buffer.byteLength(dto.password, 'utf8') > 72)
      throw new BadRequestException('Password must not exceed 72 UTF-8 bytes');
    const passwordHash = await hash(dto.password, PASSWORD_ROUNDS);
    try {
      const user = await this.users.createUser(
        dto.email.trim().toLowerCase(),
        dto.name,
        passwordHash,
      );
      this.logger.log(`Registered user ${user.id}`);
      return this.createSession(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    if (Buffer.byteLength(dto.password, 'utf8') > 72)
      throw new UnauthorizedException('Invalid email or password');
    const user = await this.users.findByEmailForAuthentication(
      dto.email.trim().toLowerCase(),
    );
    const valid = await compare(
      dto.password,
      user?.passwordHash ?? (await this.fallbackHash),
    );
    if (!user || !valid)
      throw new UnauthorizedException('Invalid email or password');
    return this.createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  private async createSession(user: PublicUser) {
    return {
      accessToken: await this.jwt.signAsync({ sub: user.id }),
      tokenType: 'Bearer',
      expiresIn: this.config.getOrThrow<number>('JWT_TTL_SECONDS'),
      user,
    };
  }
}
