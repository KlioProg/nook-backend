import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnvironment } from './common/config/env.validation.js';
import { HealthController } from './common/health.controller.js';
import { HealthService } from './common/health.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { SpotsModule } from './spots/spots.module.js';
import { AmenitiesModule } from './amenities/amenities.module.js';
import { PurposesModule } from './purposes/purposes.module.js';
import { DiscoveryModule } from './discovery/discovery.module.js';
import { FavoritesModule } from './favorites/favorites.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 120 }] }),
    PrismaModule,
    UsersModule,
    SpotsModule,
    AmenitiesModule,
    PurposesModule,
    DiscoveryModule,
    FavoritesModule,
  ],
  controllers: [HealthController],
  providers: [HealthService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
