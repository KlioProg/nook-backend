import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npm run seed',
  },
  // Generating the client and offline migration diffs do not need credentials.
  datasource: { url: process.env.DIRECT_URL || process.env.DATABASE_URL || '' },
});
