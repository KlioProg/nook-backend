import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AmenityCode } from '../generated/prisma/enums.js';
import { AmenitiesService } from './amenities.service.js';

@ApiTags('Amenities')
@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly amenities: AmenitiesService) {}

  @Get()
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: { type: 'string', enum: Object.values(AmenityCode) },
    },
  })
  findAll() {
    return this.amenities.findAll();
  }
}
