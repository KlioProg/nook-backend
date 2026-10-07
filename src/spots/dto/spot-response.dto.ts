import { ApiProperty } from '@nestjs/swagger';
import { AmenityCode, PurposeCode } from '../../generated/prisma/enums.js';

export class SpotResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() name: string;
  @ApiProperty() description: string;
  @ApiProperty() address: string;
  @ApiProperty() latitude: number;
  @ApiProperty() longitude: number;
  @ApiProperty() minPrice: number;
  @ApiProperty() maxPrice: number;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt: Date;
  @ApiProperty({ enum: AmenityCode, isArray: true }) amenities: AmenityCode[];
  @ApiProperty({ enum: PurposeCode, isArray: true }) purposes: PurposeCode[];
}
