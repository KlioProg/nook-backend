# Nook backend

A small NestJS + TypeScript + Prisma API for student place discovery. Development uses local PostgreSQL first; Neon can be configured later. The Next.js frontend talks only to this API.

## Setup

Use Node.js 24 LTS, npm, and Docker Desktop with Linux containers. From `nook-backend`:

```bash
npm install
cp .env.example .env
```

PowerShell: `Copy-Item .env.example .env`.

The example environment points to the local PostgreSQL container:

```env
DATABASE_URL=postgresql://nook:nook_dev_password@localhost:5432/nook?sslmode=disable
DIRECT_URL=
```

Leave `DIRECT_URL` empty so the API, migrations, and seed all use the same local database. The username/password above are local development credentials. Start Docker Desktop, then start PostgreSQL:

```bash
docker compose up -d --wait db
```

PostgreSQL listens on `localhost:5432`. Its data persists in the `nook_postgres_data` Docker volume. The image's volume location follows the [official PostgreSQL Docker image documentation](https://hub.docker.com/_/postgres).

Generate **two different** random keys, one for `JWT_SECRET` and one for `SPOT_WRITE_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it twice and paste each result into `.env`. Keep the management key on the server or in a trusted API client. Never put it in browser code or a `NEXT_PUBLIC_` variable.

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

The API defaults to `http://localhost:3001/api/v1`. Development Swagger docs are at `http://localhost:3001/api/docs`; the database health check is at `http://localhost:3001/health`. Keep the Next.js frontend running separately on port 3000.

If you already have PostgreSQL installed locally, create a `nook` database and set `DATABASE_URL` to that installation's credentials instead; you can skip the Docker database command.

The seed creates eight **fictional development spots** around the Jacinto/Roxas area. Prices, amenities, purposes, and addresses are samples, not verified business information. Repeating the seed updates these same eight records and replaces their amenity/purpose links. It does not create accounts or delete unrelated spots. Do not seed a production database.

## API

Responses are plain objects or arrays, matching the initial discovery contract. Errors have `{ "statusCode": 400, "message": "...", "error": "Bad Request" }`; validation errors may have an array of messages. List endpoints accept `page` (default 1) and `limit` (default 20, maximum 100). An empty page returns `[]`.

| Method | Route | Access |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Public: `{ email, password, name }` |
| POST | `/api/v1/auth/login` | Public: `{ email, password }` |
| GET | `/api/v1/auth/me` | Bearer token |
| GET | `/api/v1/spots` | Public |
| GET | `/api/v1/spots/:id` | Public, active spot only |
| POST | `/api/v1/spots` | `X-Spot-Write-Key` |
| PATCH | `/api/v1/spots/:id` | `X-Spot-Write-Key` |
| GET | `/api/v1/amenities` | Public catalog |
| GET | `/api/v1/purposes` | Public catalog |
| GET | `/api/v1/discovery` | Public |
| GET | `/api/v1/favorites` | Bearer token |
| POST | `/api/v1/favorites/:spotId` | Bearer token |
| DELETE | `/api/v1/favorites/:spotId` | Bearer token; returns 204 |
| GET | `/health` | Public |

Registration/login return `{ accessToken, tokenType, expiresIn, user }`. Use `Authorization: Bearer <accessToken>` for authenticated requests. Emails are normalized to lowercase. Passwords require at least eight characters and at most 72 UTF-8 bytes, and are hashed with bcrypt. Password hashes never appear in responses. Tokens expire; log in again to obtain a new one. No refresh-token system is included.

Favorites use the authenticated user, never a client-supplied user ID. Repeated adds return the existing favorite, and repeated removes succeed. You cannot newly favorite inactive or missing spots. Existing favorites retain inactive spots with `isActive: false` so a client can show that the listing is unavailable.

### Spot filters and writes

```http
GET /api/v1/spots?maxPrice=200&purpose=STUDY&amenity=WIFI&page=1&limit=20
```

`minPrice` and `maxPrice` select spots whose price range **overlaps** the requested range. A `maxPrice=150` filter includes a spot priced 80–200 because there is an affordable option; it does not guarantee every purchase costs under 150. `purpose` and `amenity` accept a single enum code. Results default to `isActive=true` and sort by name, then ID. `isActive=false` explicitly lists inactive records.

Example POST body:

```json
{
  "name": "Sample Cafe",
  "description": "Development sample",
  "address": "Sample address, Davao City",
  "latitude": 7.071,
  "longitude": 125.612,
  "minPrice": 80,
  "maxPrice": 200,
  "amenities": ["WIFI", "OUTLET"],
  "purposes": ["STUDY", "CHILL"],
  "isActive": true
}
```

`isActive` defaults to true when creating. PATCH accepts any subset; sending `amenities` or `purposes` replaces that complete set, and `[]` clears it. Omitted fields keep their current values. Nulls and unknown fields are rejected. Deactivate with `{ "isActive": false }`; no deletion endpoint is included. The management key protects these two write endpoints without adding roles to the initial User model.

### Discovery

```bash
curl "http://localhost:3001/api/v1/discovery?latitude=7.07&longitude=125.61&availableMinutes=120&budget=150&purpose=STUDY&amenities=WIFI,OUTLET"
```

Required inputs: `latitude` (−90 to 90), `longitude` (−180 to 180), positive `availableMinutes`, and nonnegative `budget`. Optional: `purpose`, comma-separated `amenities`, `page`, and `limit`.

Discovery returns only active spots with `minPrice <= budget`, the requested purpose, and **every** requested amenity. Prices are in Philippine pesos. PostgreSQL calculates approximate Haversine distances, sorts nearest first, and paginates before Prisma loads the matching spot relations. `distanceKm` is rounded to three decimal places. It is a straight-line estimate, not a route distance or travel time.

`availableMinutes` is accepted and validated but does not affect results yet. There is no guarantee a student can complete a round trip in that time.

With the seed, the request above returns Jacinto Study Cafe, Roxas Coffee Corner, and Project Lounge, in that order. The first result includes:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "name": "Sample Jacinto Study Cafe",
  "minPrice": 80,
  "maxPrice": 200,
  "distanceKm": 0.247,
  "amenities": ["AIRCON", "OUTLET", "RESTROOM", "WIFI"],
  "purposes": ["CHILL", "GROUP_PROJECT", "STUDY"],
  "isActive": true
}
```

Responses also include description, address, coordinates, and timestamps.

Amenity codes: `WIFI`, `OUTLET`, `AIRCON`, `RESTROOM`, `PARKING`.

Purpose codes: `STUDY`, `HANGOUT`, `GROUP_PROJECT`, `CHILL`, `DATE`, `MEETING`, `INTERVIEW`, `QUICK_BITE`.

## Structure

```text
src/
  users/       User persistence, minimal JWT registration/login, guard
  spots/       Spot CRUD, filters, response mapping
  amenities/   Amenity catalog and relation creation
  purposes/    Purpose catalog and relation creation
  discovery/   Budget/purpose/amenity matching and distance ordering
  favorites/   User-owned saved spots
  prisma/      Shared database client lifecycle
  common/      Configuration, validation helpers, errors, management guard, health
prisma/
  schema.prisma
  migrations/
  seed.ts
```

Controllers delegate to services; Prisma handles persistence. Explicit join tables model amenities and purposes. Favorites have a unique `(userId, spotId)` constraint. Spot prices use PostgreSQL decimals and serialize as JSON numbers. Database checks also enforce valid coordinates and `0 <= minPrice <= maxPrice`.

Only the initial discovery foundation is implemented. New features can be added as separate modules when needed.

## Environment

| Variable | Meaning / default |
| --- | --- |
| `NODE_ENV` | `development`, `test`, or `production`; default development |
| `PORT` | Default 3001 |
| `DATABASE_URL` | PostgreSQL runtime URL; the example uses local Docker PostgreSQL |
| `DIRECT_URL` | Leave empty locally; optional direct migration URL for a hosted database later |
| `FRONTEND_URL` | Allowed frontend origin; default `http://localhost:3000`; HTTPS required in production |
| `JWT_SECRET` | Required; at least 32 characters |
| `JWT_TTL_SECONDS` | 60–604800 seconds; default 3600 |
| `SPOT_WRITE_KEY` | Required distinct management key; at least 32 characters |

Startup rejects invalid configuration. Helmet and global DTO validation are enabled. Swagger is disabled in production. Basic in-memory throttling allows 120 requests per minute per IP, with five registration/login attempts per minute per route. It is intended for a single API instance. Do not enable proxy trust without configuring it for your hosting environment.

## Migrations

Apply the checked-in initial migration with `npx prisma migrate deploy`. When changing the schema in development:

```bash
npx prisma migrate dev --name describe_change
npx prisma generate
```

Prisma 7 runs seeding explicitly via `npx prisma db seed`. The local container's development user can create the shadow database used by `migrate dev`. Keep database credentials out of git; never reset shared or production data to resolve migration drift.

## Checks

If seeding fails, check the specific message printed before the exit-code summary. For local development, use the local URL from `.env.example`, leave `DIRECT_URL` empty, and check `docker compose ps db` to confirm PostgreSQL is healthy. Missing-table errors mean you need to run `npx prisma migrate deploy` against the same database before seeding. The seed reports known connection/schema error codes without printing database credentials.

```bash
npm run build
npm run lint
npm run format:check
npm test
npm run test:e2e
```

The existing Vitest/Oxlint tooling is retained. Tests compile TypeScript first to preserve Nest decorator metadata. Tests use an isolated in-memory PostgreSQL instance (PGlite) through the real Prisma PostgreSQL adapter; they never use your configured development or hosted database. They cover validation, Haversine edge cases, discovery filters and ordering, migrations/seed repeatability, authentication, protected spot writes, and favorite ownership/duplicates. After editing tests, rerun `npm test` to recompile before watch mode reflects those changes.

## Docker

The usual development workflow runs only PostgreSQL in Docker and uses `npm run start:dev` on your computer for hot reload. To stop the database while preserving its volume:

```bash
docker compose stop db
```

To run both the API and database in Docker, use the optional `app` profile:

```bash
docker compose up -d --wait db
docker compose --profile app build api
docker compose --profile app run --rm api node node_modules/prisma/build/index.js migrate deploy
docker compose --profile app up -d api
```

Set up `.env` and its two keys first. The containerized API connects to `db:5432`; commands run on your computer connect to `localhost:5432`. Both reach the same PostgreSQL database. Seed sample data from your development checkout if needed. Migrations run explicitly before the API starts. This Compose file is for local development.

## Neon later

When local development is ready, set `DATABASE_URL` to Neon's pooled PostgreSQL URL with TLS enabled and optionally set `DIRECT_URL` to its direct migration URL. `prisma.config.ts` selects `DIRECT_URL` when present; the running API and seed use `DATABASE_URL`. See [Prisma configuration](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference).

Apply the same checked-in migrations to the hosted database; the schema and domain services do not need to change. Changing a connection URL does not move existing local records. Data transfer and deployment can be handled at that stage.
