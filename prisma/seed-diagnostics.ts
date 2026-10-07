export function validateSeedDatabaseUrl(value: string | undefined): string {
  if (!value)
    throw new Error(
      'DATABASE_URL is required to seed. Set it in nook-backend/.env.',
    );

  let url: URL;
  try {
    url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error();
  } catch {
    throw new Error(
      'DATABASE_URL must be a valid PostgreSQL connection string. Use the local URL in .env.example or a complete URL from your database provider.',
    );
  }

  if (
    /^host(-pooler)?\.neon\.tech$/i.test(url.hostname) ||
    url.username === 'USER' ||
    url.password === 'PASSWORD'
  ) {
    throw new Error(
      'DATABASE_URL still contains example placeholders. Use the local URL in .env.example or replace the placeholders with your database connection details.',
    );
  }
  return value;
}

const errorHints: Record<string, string> = {
  ENOTFOUND:
    'The database hostname cannot be resolved. Check DATABASE_URL for placeholders or a mistyped hostname.',
  EAI_AGAIN:
    'DNS lookup failed temporarily. Check your internet connection and retry.',
  ECONNREFUSED:
    'The database connection was refused. Check the hostname, port, and database availability.',
  ETIMEDOUT:
    'The database connection timed out. Check your network and database availability.',
  '28P01':
    'Database authentication failed. Check the username and password in DATABASE_URL.',
  '3D000':
    'The configured database does not exist. Check the database name in DATABASE_URL.',
  '42P01':
    'Database tables are missing. Run npx prisma migrate deploy before seeding.',
  P1000:
    'Database authentication failed. Check the username and password in DATABASE_URL.',
  P1001:
    'Cannot reach the database. Check DATABASE_URL and your internet connection.',
  P1002:
    'The database connection timed out. Check your network and database availability.',
  P1003:
    'The configured database does not exist. Check the database name in DATABASE_URL.',
  P1010: 'The database user does not have permission to access the database.',
  P1011:
    'The TLS connection failed. Check the connection string and certificate configuration.',
  P2021:
    'Database tables are missing. Run npx prisma migrate deploy before seeding.',
  P2022:
    'The database schema is out of date. Run npx prisma migrate deploy before seeding.',
  P2028:
    'The seed transaction could not start or finish. Check the database connection and retry.',
};

export function describeSeedError(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    const hint = errorHints[error.code];
    if (hint) return `Seed failed (${error.code}). ${hint}`;
  }
  // Driver/Prisma messages can contain credentials, SQL, or connection URLs.
  return 'Seed failed. Check DATABASE_URL and run npx prisma migrate deploy before seeding.';
}
