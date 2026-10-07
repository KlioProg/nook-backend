import { PartialType } from '@nestjs/swagger';
import { CreateSpotDto } from './create-spot.dto.js';

export class UpdateSpotDto extends PartialType(CreateSpotDto, {
  skipNullProperties: false,
}) {}
