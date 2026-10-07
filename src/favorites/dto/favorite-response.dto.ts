import { ApiProperty } from '@nestjs/swagger';
import { SpotResponseDto } from '../../spots/dto/spot-response.dto.js';

export class FavoriteResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) userId: string;
  @ApiProperty({ format: 'uuid' }) spotId: string;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ type: SpotResponseDto }) spot: SpotResponseDto;
}
