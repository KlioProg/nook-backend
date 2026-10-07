import { Module } from '@nestjs/common';
import { PurposesService } from './purposes.service.js';
import { PurposesController } from './purposes.controller.js';

@Module({
  controllers: [PurposesController],
  providers: [PurposesService],
  exports: [PurposesService],
})
export class PurposesModule {}
