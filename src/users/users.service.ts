import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { publicUserSelect } from './user-view.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmailForAuthentication(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findPublicUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
  }

  createUser(email: string, name: string, passwordHash: string) {
    return this.prisma.user.create({
      data: { email, name, passwordHash },
      select: publicUserSelect,
    });
  }
}
