import type { PrismaClient } from '../src/generated/prisma/client.js';
import { AmenityCode, PurposeCode } from '../src/generated/prisma/enums.js';
import { sampleSpots } from './sample-spots.js';

export async function seedDevelopmentSpots(prisma: PrismaClient) {
  await prisma.$transaction(
    async (tx) => {
      await tx.amenity.createMany({
        data: Object.values(AmenityCode).map((code) => ({ code })),
        skipDuplicates: true,
      });
      await tx.purpose.createMany({
        data: Object.values(PurposeCode).map((code) => ({ code })),
        skipDuplicates: true,
      });
      for (const sample of sampleSpots) {
        const { amenities, purposes, ...data } = sample;
        const links = {
          amenities: {
            create: amenities.map((code) => ({
              amenity: { connect: { code } },
            })),
          },
          purposes: {
            create: purposes.map((code) => ({
              purpose: { connect: { code } },
            })),
          },
        };
        await tx.spot.upsert({
          where: { id: data.id },
          create: { ...data, ...links },
          update: {
            ...data,
            amenities: { deleteMany: {}, ...links.amenities },
            purposes: { deleteMany: {}, ...links.purposes },
          },
        });
      }
    },
    { timeout: 30000 },
  );
}
