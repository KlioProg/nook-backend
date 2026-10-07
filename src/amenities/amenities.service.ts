import { Injectable } from '@nestjs/common';
import { AmenityCode } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AmenitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const amenities = await this.prisma.amenity.findMany({
      orderBy: { code: 'asc' },
    });
    return amenities.map((amenity) => amenity.code);
  }

  createLinks(codes: AmenityCode[]) {
    return codes.map((code) => ({
      amenity: { connectOrCreate: { where: { code }, create: { code } } },
    }));
  }
}
