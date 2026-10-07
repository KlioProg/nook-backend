const MAX_PORT = 65535;

function integer(value: unknown, fallback: number, min: number, max: number) {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error('must be an integer in the permitted range');
  }
  return parsed;
}

export function validateEnvironment(env: Record<string, unknown>) {
  const errors: string[] = [];
  const nodeEnv = env.NODE_ENV ?? 'development';
  if (
    typeof nodeEnv !== 'string' ||
    !['development', 'test', 'production'].includes(nodeEnv)
  ) {
    errors.push('NODE_ENV must be development, test, or production');
  }
  try {
    if (typeof env.DATABASE_URL !== 'string') throw new Error();
    const url = new URL(env.DATABASE_URL);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error();
  } catch {
    errors.push('DATABASE_URL must be a PostgreSQL connection URL');
  }
  const frontendUrl = env.FRONTEND_URL ?? 'http://localhost:3000';
  let frontendOrigin = '';
  try {
    if (typeof frontendUrl !== 'string') throw new Error();
    const url = new URL(frontendUrl);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.origin !== url.href.replace(/\/$/, '')
    ) {
      throw new Error();
    }
    if (nodeEnv === 'production' && url.protocol !== 'https:')
      throw new Error();
    frontendOrigin = url.origin;
  } catch {
    errors.push('FRONTEND_URL must be a single origin (HTTPS in production)');
  }
  for (const key of ['JWT_SECRET', 'SPOT_WRITE_KEY']) {
    if (typeof env[key] !== 'string' || env[key].length < 32) {
      errors.push(`${key} must contain at least 32 characters`);
    }
  }
  if (env.JWT_SECRET && env.JWT_SECRET === env.SPOT_WRITE_KEY) {
    errors.push('JWT_SECRET and SPOT_WRITE_KEY must be different');
  }
  let port = 3001;
  let jwtTtl = 3600;
  try {
    port = integer(env.PORT, 3001, 1, MAX_PORT);
  } catch {
    errors.push('PORT must be an integer from 1 to 65535');
  }
  try {
    jwtTtl = integer(env.JWT_TTL_SECONDS, 3600, 60, 604800);
  } catch {
    errors.push('JWT_TTL_SECONDS must be an integer from 60 to 604800');
  }
  if (errors.length)
    throw new Error(`Invalid environment: ${errors.join('; ')}`);
  return {
    ...env,
    NODE_ENV: nodeEnv,
    PORT: port,
    JWT_TTL_SECONDS: jwtTtl,
    FRONTEND_URL: frontendOrigin,
  };
}
