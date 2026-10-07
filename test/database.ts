import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { seedDevelopmentSpots } from '../prisma/seed-data.js';

export async function createTestDatabase() {
  const db = await PGlite.create();
  const migration = await readFile(
    join(
      process.cwd(),
      'prisma/migrations/20261007000000_initial/migration.sql',
    ),
    'utf8',
  );
  await db.exec(migration);
  const server = new PGLiteSocketServer({
    db,
    host: '127.0.0.1',
    port: 0,
    maxConnections: 1,
  });
  await server.start();
  const connectionString = `postgresql://postgres:postgres@${server.getServerConn()}/postgres?sslmode=disable`;
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      max: 1,
      connectionTimeoutMillis: 5000,
    }),
  });
  try {
    await seedDevelopmentSpots(prisma);
  } catch (error) {
    await prisma.$disconnect();
    await server.stop();
    await db.close();
    throw error;
  }
  return {
    db,
    prisma,
    connectionString,
    async close() {
      await prisma.$disconnect();
      await server.stop();
      await db.close();
    },
  };
}
