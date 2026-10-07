import 'reflect-metadata';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  'postgresql://postgres:postgres@127.0.0.1:1/postgres';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-only-jwt-secret-at-least-32-characters';
process.env.SPOT_WRITE_KEY = 'test-only-management-key-at-least-32-characters';
process.env.JWT_TTL_SECONDS = '3600';
