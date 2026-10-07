import { Prisma } from '../generated/prisma/client.js';

export const spotInclude = {
  amenities: { include: { amenity: true } },
  purposes: { include: { purpose: true } },
} satisfies Prisma.SpotInclude;

export type SpotWithRelations = Prisma.SpotGetPayload<{
  include: typeof spotInclude;
}>;

export function toSpotView(spot: SpotWithRelations) {
  const { amenities, purposes, minPrice, maxPrice, ...fields } = spot;
  return {
    ...fields,
    minPrice: Number(minPrice),
    maxPrice: Number(maxPrice),
    amenities: amenities.map((link) => link.amenity.code).sort(),
    purposes: purposes.map((link) => link.purpose.code).sort(),
  };
}
