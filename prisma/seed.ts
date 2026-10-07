import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { sampleSpots } from './sample-spots.js';
import { seedDevelopmentSpots } from './seed-data.js';
import {
  describeSeedError,
  validateSeedDatabaseUrl,
} from './seed-diagnostics.js';

const logger = new Logger('Seed');
if (process.env.NODE_ENV === 'production')
  throw new Error('Sample seeding is only intended for development');
const connectionString = validateSeedDatabaseUrl(process.env.DATABASE_URL);

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 5000,
  }),
});
try {
  await seedDevelopmentSpots(prisma);
  logger.log(`Seeded ${sampleSpots.length} fictional development spots`);
} catch (error) {
  logger.error(describeSeedError(error));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
