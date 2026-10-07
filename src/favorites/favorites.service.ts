import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SpotsService } from '../spots/spots.service.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { spotInclude, toSpotView } from '../spots/spot-view.js';

const favoriteInclude = { spot: { include: spotInclude } };

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spots: SpotsService,
  ) {}

  async findAll(userId: string, query: PaginationDto) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: favoriteInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return favorites.map(({ spot, ...favorite }) => ({
      ...favorite,
      spot: toSpotView(spot),
    }));
  }

  async addFavorite(userId: string, spotId: string) {
    await this.spots.getSpotById(spotId);
    // Compound uniqueness plus upsert makes repeated requests safe.
    const { spot, ...favorite } = await this.saveFavorite(userId, spotId);
    return { ...favorite, spot: toSpotView(spot) };
  }

  private async saveFavorite(userId: string, spotId: string) {
    const where = { userId_spotId: { userId, spotId } };
    try {
      return await this.prisma.favorite.upsert({
        where,
        create: { userId, spotId },
        update: {},
        include: favoriteInclude,
      });
    } catch (error) {
      // Nested reads can prevent a native upsert; another request may win the insert.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return this.prisma.favorite.findUniqueOrThrow({
          where,
          include: favoriteInclude,
        });
      }
      throw error;
    }
  }

  async removeFavorite(userId: string, spotId: string) {
    await this.prisma.favorite.deleteMany({ where: { userId, spotId } });
  }
}
