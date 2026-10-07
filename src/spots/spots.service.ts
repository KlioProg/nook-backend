import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AmenitiesService } from '../amenities/amenities.service.js';
import { PurposesService } from '../purposes/purposes.service.js';
import { CreateSpotDto } from './dto/create-spot.dto.js';
import { UpdateSpotDto } from './dto/update-spot.dto.js';
import { SpotQueryDto } from './dto/spot-query.dto.js';
import { spotInclude, toSpotView } from './spot-view.js';

function validatePriceRange(minPrice: number, maxPrice: number) {
  if (minPrice > maxPrice)
    throw new BadRequestException('minPrice must not exceed maxPrice');
}

@Injectable()
export class SpotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly amenities: AmenitiesService,
    private readonly purposes: PurposesService,
  ) {}

  async findAll(query: SpotQueryDto) {
    if (query.minPrice !== undefined && query.maxPrice !== undefined)
      validatePriceRange(query.minPrice, query.maxPrice);
    // Include spots whose price range overlaps the requested range.
    const where: Prisma.SpotWhereInput = {
      isActive: query.isActive ?? true,
      ...(query.maxPrice !== undefined && {
        minPrice: { lte: query.maxPrice },
      }),
      ...(query.minPrice !== undefined && {
        maxPrice: { gte: query.minPrice },
      }),
      ...(query.amenity && {
        amenities: { some: { amenity: { code: query.amenity } } },
      }),
      ...(query.purpose && {
        purposes: { some: { purpose: { code: query.purpose } } },
      }),
    };
    const spots = await this.prisma.spot.findMany({
      where,
      include: spotInclude,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return spots.map(toSpotView);
  }

  async getSpotById(id: string) {
    const spot = await this.prisma.spot.findFirst({
      where: { id, isActive: true },
      include: spotInclude,
    });
    if (!spot) throw new NotFoundException('Spot not found');
    return toSpotView(spot);
  }

  async createSpot(dto: CreateSpotDto) {
    validatePriceRange(dto.minPrice, dto.maxPrice);
    const { amenities, purposes, ...data } = dto;
    const spot = await this.prisma.spot.create({
      data: {
        ...data,
        amenities: { create: this.amenities.createLinks(amenities) },
        purposes: { create: this.purposes.createLinks(purposes) },
      },
      include: spotInclude,
    });
    return toSpotView(spot);
  }

  async updateSpot(id: string, dto: UpdateSpotDto) {
    const current = await this.prisma.spot.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Spot not found');
    validatePriceRange(
      dto.minPrice ?? Number(current.minPrice),
      dto.maxPrice ?? Number(current.maxPrice),
    );
    const { amenities, purposes, ...data } = dto;
    const spot = await this.prisma.spot.update({
      where: { id },
      data: {
        ...data,
        ...(amenities !== undefined && {
          amenities: {
            deleteMany: {},
            create: this.amenities.createLinks(amenities),
          },
        }),
        ...(purposes !== undefined && {
          purposes: {
            deleteMany: {},
            create: this.purposes.createLinks(purposes),
          },
        }),
      },
      include: spotInclude,
    });
    return toSpotView(spot);
  }
}
