import { ApiProperty } from '@nestjs/swagger';
import { SpotResponseDto } from '../../spots/dto/spot-response.dto.js';

export class DiscoveryResponseDto extends SpotResponseDto {
  @ApiProperty({
    example: 0.7,
    description:
      'Approximate straight-line distance in kilometers; not travel time.',
  })
  distanceKm: number;
}
