import { describe, expect, it } from 'vitest';
import {
  describeSeedError,
  validateSeedDatabaseUrl,
} from '../prisma/seed-diagnostics.js';

describe('seed diagnostics', () => {
  it('rejects missing and example database URLs before making a connection', () => {
    expect(() => validateSeedDatabaseUrl(undefined)).toThrow(
      'DATABASE_URL is required',
    );
    expect(() =>
      validateSeedDatabaseUrl(
        'postgresql://USER:PASSWORD@HOST-pooler.neon.tech/nook?sslmode=require',
      ),
    ).toThrow('example placeholders');
    expect(() => validateSeedDatabaseUrl('https://example.com')).toThrow(
      'valid PostgreSQL',
    );
  });

  it('accepts a configured PostgreSQL URL', () => {
    const url = 'postgresql://student:secret@localhost/nook';
    expect(validateSeedDatabaseUrl(url)).toBe(url);
  });

  it.each([
    ['ENOTFOUND', 'hostname cannot be resolved'],
    ['28P01', 'authentication failed'],
    ['P2021', 'npx prisma migrate deploy'],
    ['P2028', 'transaction could not start or finish'],
  ])(
    'reports an actionable diagnosis for %s without revealing the original message',
    (code, hint) => {
      const result = describeSeedError({
        code,
        message: 'postgresql://user:secret-password@private-host/nook',
      });
      expect(result).toContain(code);
      expect(result).toContain(hint);
      expect(result).not.toContain('secret-password');
      expect(result).not.toContain('private-host');
    },
  );

  it('keeps unexpected errors private', () => {
    const result = describeSeedError(new Error('secret-password'));
    expect(result).toContain('Seed failed');
    expect(result).not.toContain('secret-password');
  });
});
