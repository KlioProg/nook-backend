import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/common/setup-app.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import type { AuthResponseDto } from '../src/users/dto/auth-response.dto.js';
import type { SpotResponseDto } from '../src/spots/dto/spot-response.dto.js';
import type { DiscoveryResponseDto } from '../src/discovery/dto/discovery-response.dto.js';
import { createTestDatabase } from './database.js';

const sampleId = '00000000-0000-4000-8000-000000000001';
const inactiveId = '00000000-0000-4000-8000-000000000008';
const absentId = '00000000-0000-4000-8000-000000000099';
const writeKey = process.env.SPOT_WRITE_KEY!;
const password = 'student-password';

describe('Nook API with real Prisma and PostgreSQL', () => {
  let app: INestApplication;
  let database: Awaited<ReturnType<typeof createTestDatabase>>;
  let student: AuthResponseDto;
  let secondStudent: AuthResponseDto;

  beforeAll(async () => {
    database = await createTestDatabase();
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(database.prisma)
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    setupApp(app);
    await app.init();
    const first = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'FIRST@example.com', name: 'First Student', password })
      .expect(201);
    student = first.body as AuthResponseDto;
    const second = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'second@example.com', name: 'Second Student', password })
      .expect(201);
    secondStudent = second.body as AuthResponseDto;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (database) await database.close();
  });

  it('serves health at the root and applies security headers and configured CORS', async () => {
    const health = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'http://localhost:3000')
      .expect(200);
    expect(health.body).toEqual({ status: 'ok', database: 'connected' });
    expect(health.headers['x-content-type-options']).toBe('nosniff');
    expect(health.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
    const cors = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'https://untrusted.example');
    expect(cors.headers['access-control-allow-origin']).not.toBe(
      'https://untrusted.example',
    );
  });

  it('registers and logs in without exposing password hashes', async () => {
    expect(student.user.email).toBe('first@example.com');
    expect(student.user).not.toHaveProperty('passwordHash');
    const stored = await database.prisma.user.findUniqueOrThrow({
      where: { email: 'first@example.com' },
    });
    expect(stored.passwordHash).not.toBe(password);
    expect(stored.passwordHash).toMatch(/^\$2[ab]\$12\$/);
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: ' FIRST@EXAMPLE.COM ', password })
      .expect(200);
    expect((login.body as AuthResponseDto).user).not.toHaveProperty(
      'passwordHash',
    );
    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .auth(student.accessToken, { type: 'bearer' })
      .expect(200);
    expect(me.body).not.toHaveProperty('passwordHash');
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'first@example.com', name: 'Duplicate', password })
      .expect(409);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'first@example.com', password: 'incorrect-password' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'multibyte@example.com',
        name: 'Student',
        password: '😀'.repeat(30),
      })
      .expect(400);
  });

  it('returns the requested discovery result as an array sorted by distance', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/discovery')
      .query({
        latitude: 7.07,
        longitude: 125.61,
        availableMinutes: 120,
        budget: 150,
        purpose: 'STUDY',
        amenities: 'WIFI,OUTLET',
      })
      .expect(200);
    const spots = response.body as DiscoveryResponseDto[];
    expect(spots.map((spot) => spot.name)).toEqual([
      'Sample Jacinto Study Cafe',
      'Sample Roxas Coffee Corner',
      'Sample Project Lounge',
    ]);
    expect(spots[0]).toMatchObject({
      id: sampleId,
      minPrice: 80,
      maxPrice: 200,
      distanceKm: 0.247,
      isActive: true,
    });
    expect(spots[0].amenities).toEqual(
      expect.arrayContaining(['WIFI', 'OUTLET']),
    );
  });

  it.each([
    { latitude: 91 },
    { budget: -1 },
    { availableMinutes: 0 },
    { purpose: 'BAD' },
    { amenities: 'WIFI,BAD' },
    { latitude: '' },
    { limit: 1000 },
    { unexpected: 'x' },
  ])('rejects invalid discovery requests (%j)', async (invalid) => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/discovery')
      .query({
        latitude: 7.07,
        longitude: 125.61,
        availableMinutes: 120,
        budget: 150,
        ...invalid,
      })
      .expect(400);
    expect(response.body).not.toHaveProperty('stack');
  });

  it('filters and paginates spots, defaults to active, and supports false explicitly', async () => {
    const all = await request(app.getHttpServer())
      .get('/api/v1/spots')
      .expect(200);
    expect((all.body as SpotResponseDto[]).every((spot) => spot.isActive)).toBe(
      true,
    );
    const filtered = await request(app.getHttpServer())
      .get('/api/v1/spots')
      .query({ maxPrice: 150, purpose: 'STUDY', amenity: 'OUTLET', limit: 2 })
      .expect(200);
    expect(
      (filtered.body as SpotResponseDto[]).map((spot) => spot.name),
    ).toEqual(['Sample Jacinto Study Cafe', 'Sample Project Lounge']);
    const inactive = await request(app.getHttpServer())
      .get('/api/v1/spots')
      .query({ isActive: 'false' })
      .expect(200);
    expect((inactive.body as SpotResponseDto[]).map((spot) => spot.id)).toEqual(
      [inactiveId],
    );
    await request(app.getHttpServer())
      .get(`/api/v1/spots/${inactiveId}`)
      .expect(404);
    await request(app.getHttpServer())
      .get('/api/v1/spots')
      .query({ minPrice: 200, maxPrice: 100 })
      .expect(400);
  });

  it('protects spot writes and validates IDs, price ranges, and null patches', async () => {
    const data = {
      name: 'Created Spot',
      description: 'Test spot',
      address: 'Test address',
      latitude: 7.07,
      longitude: 125.61,
      minPrice: 50,
      maxPrice: 100,
      amenities: ['WIFI'],
      purposes: ['STUDY'],
    };
    await request(app.getHttpServer())
      .post('/api/v1/spots')
      .send(data)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/spots')
      .auth(student.accessToken, { type: 'bearer' })
      .send(data)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/spots')
      .set('X-Spot-Write-Key', writeKey)
      .send({ ...data, minPrice: 200 })
      .expect(400);
    const created = await request(app.getHttpServer())
      .post('/api/v1/spots')
      .set('X-Spot-Write-Key', writeKey)
      .send(data)
      .expect(201);
    const spot = created.body as SpotResponseDto;
    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/spots/${spot.id}`)
      .set('X-Spot-Write-Key', writeKey)
      .send({ amenities: ['WIFI', 'OUTLET'], purposes: [], isActive: false })
      .expect(200);
    expect((updated.body as SpotResponseDto).amenities).toEqual([
      'OUTLET',
      'WIFI',
    ]);
    expect((updated.body as SpotResponseDto).purposes).toEqual([]);
    await request(app.getHttpServer())
      .patch(`/api/v1/spots/${spot.id}`)
      .set('X-Spot-Write-Key', writeKey)
      .send({ maxPrice: 10 })
      .expect(400);
    await request(app.getHttpServer())
      .patch(`/api/v1/spots/${spot.id}`)
      .set('X-Spot-Write-Key', writeKey)
      .send({ name: null })
      .expect(400);
    await request(app.getHttpServer())
      .patch(`/api/v1/spots/${absentId}`)
      .set('X-Spot-Write-Key', writeKey)
      .send({ isActive: false })
      .expect(404);
    await request(app.getHttpServer())
      .get('/api/v1/spots/not-a-uuid')
      .expect(400);
  });

  it('isolates favorites by authenticated user and makes repeated add/remove safe', async () => {
    await request(app.getHttpServer()).get('/api/v1/favorites').expect(401);
    const first = await request(app.getHttpServer())
      .post(`/api/v1/favorites/${sampleId}`)
      .auth(student.accessToken, { type: 'bearer' })
      .expect(201);
    const again = await request(app.getHttpServer())
      .post(`/api/v1/favorites/${sampleId}`)
      .auth(student.accessToken, { type: 'bearer' })
      .expect(201);
    expect(again.body).toEqual(first.body);
    expect(
      await database.prisma.favorite.count({
        where: { userId: student.user.id, spotId: sampleId },
      }),
    ).toBe(1);
    const other = await request(app.getHttpServer())
      .get('/api/v1/favorites')
      .auth(secondStudent.accessToken, { type: 'bearer' })
      .expect(200);
    expect(other.body).toEqual([]);
    await request(app.getHttpServer())
      .delete(`/api/v1/favorites/${sampleId}`)
      .auth(secondStudent.accessToken, { type: 'bearer' })
      .expect(204);
    const own = await request(app.getHttpServer())
      .get('/api/v1/favorites')
      .auth(student.accessToken, { type: 'bearer' })
      .expect(200);
    expect(own.body).toHaveLength(1);
    await request(app.getHttpServer())
      .post(`/api/v1/favorites/${inactiveId}`)
      .auth(student.accessToken, { type: 'bearer' })
      .expect(404);
    await request(app.getHttpServer())
      .post(`/api/v1/favorites/${absentId}`)
      .auth(student.accessToken, { type: 'bearer' })
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/api/v1/favorites/${sampleId}`)
      .auth(student.accessToken, { type: 'bearer' })
      .expect(204);
    await request(app.getHttpServer())
      .delete(`/api/v1/favorites/${sampleId}`)
      .auth(student.accessToken, { type: 'bearer' })
      .expect(204);
  });

  it('handles simultaneous favorite additions without duplicates', async () => {
    const spotId = '00000000-0000-4000-8000-000000000002';
    const responses = await Promise.all(
      [0, 1].map(() =>
        request(app.getHttpServer())
          .post(`/api/v1/favorites/${spotId}`)
          .auth(student.accessToken, { type: 'bearer' })
          .expect(201),
      ),
    );
    expect(responses[0].body).toEqual(responses[1].body);
    expect(
      await database.prisma.favorite.count({
        where: { userId: student.user.id, spotId },
      }),
    ).toBe(1);
  });

  it('rejects tampered, expired, and unknown-user tokens', async () => {
    const jwt = app.get(JwtService);
    const expired = await jwt.signAsync(
      { sub: student.user.id },
      { expiresIn: -1 },
    );
    const unknownUser = await jwt.signAsync({ sub: absentId });
    for (const token of [
      `${student.accessToken}tampered`,
      expired,
      unknownUser,
    ]) {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .auth(token, { type: 'bearer' })
        .expect(401);
    }
  });

  it('rate limits repeated login attempts', async () => {
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 6; attempt++) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'missing@example.com', password });
      statuses.push(response.status);
    }
    expect(statuses).toContain(429);
  });
});
