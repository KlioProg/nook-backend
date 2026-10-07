import { Injectable } from '@nestjs/common';
import { PurposeCode } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PurposesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const purposes = await this.prisma.purpose.findMany({
      orderBy: { code: 'asc' },
    });
    return purposes.map((purpose) => purpose.code);
  }

  createLinks(codes: PurposeCode[]) {
    return codes.map((code) => ({
      purpose: { connectOrCreate: { where: { code }, create: { code } } },
    }));
  }
}
