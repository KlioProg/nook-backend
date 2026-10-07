import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './env.validation.js';

const valid = {
  DATABASE_URL: 'postgresql://localhost/nook',
  JWT_SECRET: 'a'.repeat(32),
  SPOT_WRITE_KEY: 'b'.repeat(32),
};

describe('environment validation', () => {
  it('provides typed defaults', () => {
    expect(validateEnvironment(valid)).toMatchObject({
      PORT: 3001,
      JWT_TTL_SECONDS: 3600,
      NODE_ENV: 'development',
      FRONTEND_URL: 'http://localhost:3000',
    });
  });

  it.each([
    { DATABASE_URL: '' },
    { DATABASE_URL: 'https://example.com' },
    { JWT_SECRET: '' },
    { SPOT_WRITE_KEY: '' },
    { SPOT_WRITE_KEY: 'a'.repeat(32) },
    { PORT: '0' },
    { FRONTEND_URL: 'https://example.com/path' },
    { JWT_TTL_SECONDS: 'abc' },
    { NODE_ENV: 'production', FRONTEND_URL: 'http://example.com' },
  ])('fails clearly without including secret values (%j)', (invalid) => {
    expect(() => validateEnvironment({ ...valid, ...invalid })).toThrow(
      'Invalid environment',
    );
  });
});
