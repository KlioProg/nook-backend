import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { SpotsModule } from '../spots/spots.module.js';
import { FavoritesController } from './favorites.controller.js';
import { FavoritesService } from './favorites.service.js';

@Module({
  imports: [UsersModule, SpotsModule],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
