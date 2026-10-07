import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SpotWriteGuard } from '../common/guards/spot-write.guard.js';
import { SpotsService } from './spots.service.js';
import { CreateSpotDto } from './dto/create-spot.dto.js';
import { UpdateSpotDto } from './dto/update-spot.dto.js';
import { SpotQueryDto } from './dto/spot-query.dto.js';
import { SpotResponseDto } from './dto/spot-response.dto.js';

@ApiTags('Spots')
@ApiBadRequestResponse({ description: 'Invalid input' })
@Controller('spots')
export class SpotsController {
  constructor(private readonly spots: SpotsService) {}

  @Get()
  @ApiOkResponse({ type: SpotResponseDto, isArray: true })
  findAll(@Query() query: SpotQueryDto) {
    return this.spots.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: SpotResponseDto })
  @ApiNotFoundResponse({ description: 'Spot does not exist or is inactive' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.spots.getSpotById(id);
  }

  @Post()
  @UseGuards(SpotWriteGuard)
  @ApiSecurity('spot-management')
  @ApiUnauthorizedResponse({ description: 'Missing or invalid management key' })
  @ApiCreatedResponse({ type: SpotResponseDto })
  create(@Body() dto: CreateSpotDto) {
    return this.spots.createSpot(dto);
  }

  @Patch(':id')
  @UseGuards(SpotWriteGuard)
  @ApiSecurity('spot-management')
  @ApiUnauthorizedResponse({ description: 'Missing or invalid management key' })
  @ApiNotFoundResponse({ description: 'Spot does not exist' })
  @ApiOkResponse({ type: SpotResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSpotDto,
  ) {
    return this.spots.updateSpot(id, dto);
  }
}
