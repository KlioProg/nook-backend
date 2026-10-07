import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DiscoveryService } from '../src/discovery/discovery.service.js';
import { DiscoveryQueryDto } from '../src/discovery/dto/discovery-query.dto.js';
import { distanceKmSql } from '../src/discovery/distance.sql.js';
import { Prisma } from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { seedDevelopmentSpots } from '../prisma/seed-data.js';
import { createTestDatabase } from './database.js';

describe('discovery with PostgreSQL', () => {
  let database: Awaited<ReturnType<typeof createTestDatabase>>;
  let service: DiscoveryService;
  const query = {
    page: 1,
    limit: 20,
    latitude: 7.07,
    longitude: 125.61,
    availableMinutes: 120,
    budget: 150,
    purpose: 'STUDY',
    amenities: ['WIFI', 'OUTLET'],
  } satisfies DiscoveryQueryDto;

  beforeAll(async () => {
    database = await createTestDatabase();
    service = new DiscoveryService(database.prisma as PrismaService);
  });
  afterAll(async () => {
    if (database) await database.close();
  });

  it('returns affordable active study spots with every amenity, sorted by distance', async () => {
    const result = await service.discover(query);
    expect(result.map((spot) => spot.name)).toEqual([
      'Sample Jacinto Study Cafe',
      'Sample Roxas Coffee Corner',
      'Sample Project Lounge',
    ]);
    expect(
      result.every(
        (spot) =>
          spot.isActive &&
          spot.minPrice <= 150 &&
          spot.amenities.includes('WIFI') &&
          spot.amenities.includes('OUTLET'),
      ),
    ).toBe(true);
    expect(result[0].distanceKm).toBeCloseTo(0.247, 3);
    expect(result.map((spot) => spot.distanceKm)).toEqual(
      result.map((spot) => spot.distanceKm).sort((a, b) => a - b),
    );
  });

  it('paginates after sorting by distance', async () => {
    const all = await service.discover(query);
    const page = await service.discover({ ...query, page: 2, limit: 1 });
    expect(page).toEqual([all[1]]);
  });

  it('accepts time without changing discovery and permits zero-budget places', async () => {
    expect(await service.discover({ ...query, availableMinutes: 1 })).toEqual(
      await service.discover(query),
    );
    const free = await service.discover({
      ...query,
      budget: 0,
      purpose: undefined,
      amenities: undefined,
    });
    expect(free.map((spot) => spot.name)).toEqual(['Sample Open Garden']);
    expect(await service.discover({ ...query, budget: 0 })).toEqual([]);
  });

  it.each([
    [0, 0, 0, 0, 0],
    [0, 0, 0, 1, 111.195],
    [0, 179.9, 0, -179.9, 22.239],
    [90, 0, 90, 180, 0],
    [0, 0, 0, 180, 20015.114],
  ])(
    'calculates stable Haversine distances for (%s,%s) to (%s,%s)',
    async (
      latitude,
      longitude,
      destinationLatitude,
      destinationLongitude,
      expected,
    ) => {
      const sql = Prisma.sql`SELECT ${distanceKmSql(latitude, longitude)} AS distance FROM (SELECT ${destinationLatitude}::float8 AS latitude, ${destinationLongitude}::float8 AS longitude) s`;
      const result =
        await database.prisma.$queryRaw<{ distance: number }[]>(sql);
      expect(result[0].distance).toBeCloseTo(expected, 3);
    },
  );

  it('can rerun the seed without duplicating spots or links', async () => {
    await seedDevelopmentSpots(database.prisma);
    expect(await database.prisma.spot.count()).toBe(8);
    expect(await database.prisma.amenity.count()).toBe(5);
    expect(await database.prisma.purpose.count()).toBe(8);
  });

  it('enforces price and coordinate invariants at the database', async () => {
    await expect(
      database.db.query('UPDATE "Spot" SET "minPrice" = -1 WHERE id = $1', [
        '00000000-0000-4000-8000-000000000001',
      ]),
    ).rejects.toThrow();
    await expect(
      database.db.query('UPDATE "Spot" SET "latitude" = 91 WHERE id = $1', [
        '00000000-0000-4000-8000-000000000001',
      ]),
    ).rejects.toThrow();
  });
});
