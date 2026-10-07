import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { spotInclude, toSpotView } from '../spots/spot-view.js';
import { DiscoveryQueryDto } from './dto/discovery-query.dto.js';
import { distanceKmSql } from './distance.sql.js';

type NearbySpot = { id: string; distanceKm: number };

@Injectable()
export class DiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

  async discover(query: DiscoveryQueryDto) {
    const conditions = [
      Prisma.sql`s."isActive" = TRUE`,
      Prisma.sql`s."minPrice" <= ${query.budget}`,
    ];
    if (query.purpose) {
      conditions.push(Prisma.sql`EXISTS (
        SELECT 1 FROM "SpotPurpose" sp JOIN "Purpose" p ON p.id = sp."purposeId"
        WHERE sp."spotId" = s.id AND p.code::text = ${query.purpose}
      )`);
    }
    for (const amenity of query.amenities ?? []) {
      conditions.push(Prisma.sql`EXISTS (
        SELECT 1 FROM "SpotAmenity" sa JOIN "Amenity" a ON a.id = sa."amenityId"
        WHERE sa."spotId" = s.id AND a.code::text = ${amenity}
      )`);
    }
    // Every user value is parameterized; no unsafe raw query interpolation.
    const nearby = await this.prisma.$queryRaw<NearbySpot[]>(Prisma.sql`
      SELECT s.id, ${distanceKmSql(query.latitude, query.longitude)} AS "distanceKm"
      FROM "Spot" s WHERE ${Prisma.join(conditions, ' AND ')}
      ORDER BY "distanceKm" ASC, s.id ASC
      LIMIT ${query.limit} OFFSET ${(query.page - 1) * query.limit}
    `);
    if (nearby.length === 0) return [];
    const spots = await this.prisma.spot.findMany({
      where: { id: { in: nearby.map((spot) => spot.id) }, isActive: true },
      include: spotInclude,
    });
    const byId = new Map(spots.map((spot) => [spot.id, spot]));
    return nearby.flatMap(({ id, distanceKm }) => {
      const spot = byId.get(id);
      return spot
        ? [
            {
              ...toSpotView(spot),
              distanceKm: Math.round(distanceKm * 1000) / 1000,
            },
          ]
        : [];
    });
  }
}
