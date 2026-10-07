import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DiscoveryService } from './discovery.service.js';
import { DiscoveryQueryDto } from './dto/discovery-query.dto.js';
import { DiscoveryResponseDto } from './dto/discovery-response.dto.js';

@ApiTags('Discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Get()
  @ApiOperation({
    summary:
      'Find active, affordable spots by purpose and all requested amenities, nearest first',
  })
  @ApiBadRequestResponse({
    description: 'Invalid coordinates, budget, time, purpose, or amenities',
  })
  @ApiOkResponse({ type: DiscoveryResponseDto, isArray: true })
  discover(@Query() query: DiscoveryQueryDto) {
    return this.discovery.discover(query);
  }
}
