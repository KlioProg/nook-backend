import { Module } from '@nestjs/common';
import { AmenitiesModule } from '../amenities/amenities.module.js';
import { PurposesModule } from '../purposes/purposes.module.js';
import { SpotWriteGuard } from '../common/guards/spot-write.guard.js';
import { SpotsController } from './spots.controller.js';
import { SpotsService } from './spots.service.js';

@Module({
  imports: [AmenitiesModule, PurposesModule],
  controllers: [SpotsController],
  providers: [SpotsService, SpotWriteGuard],
  exports: [SpotsService],
})
export class SpotsModule {}
