import { Prisma } from '../generated/prisma/client.js';

export const EARTH_RADIUS_KM = 6371.0088;

// Keep distance sorting in PostgreSQL so pagination returns the nearest matches.
export function distanceKmSql(latitude: number, longitude: number) {
  return Prisma.sql`2.0 * ${EARTH_RADIUS_KM}::float8 * ASIN(SQRT(LEAST(1.0, GREATEST(0.0,
    POWER(SIN(RADIANS(s."latitude" - ${latitude}) / 2), 2)
    + COS(RADIANS(${latitude})) * COS(RADIANS(s."latitude"))
    * POWER(SIN(RADIANS(s."longitude" - ${longitude}) / 2), 2)
  ))))`;
}
