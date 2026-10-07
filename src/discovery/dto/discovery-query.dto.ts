import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNumber,
  IsPositive,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { toList, toNumber } from '../../common/utils/query-transforms.js';
import { AmenityCode, PurposeCode } from '../../generated/prisma/enums.js';

export class DiscoveryQueryDto extends PaginationDto {
  @ApiProperty({ example: 7.07, minimum: -90, maximum: 90 })
  @Transform(({ value }: { value: unknown }) => toNumber(value))
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 125.61, minimum: -180, maximum: 180 })
  @Transform(({ value }: { value: unknown }) => toNumber(value))
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    example: 120,
    exclusiveMinimum: true,
    minimum: 0,
    description:
      'Accepted and validated for future use; does not affect results yet.',
  })
  @Transform(({ value }: { value: unknown }) => toNumber(value))
  @IsNumber()
  @IsPositive()
  availableMinutes: number;

  @ApiProperty({
    example: 150,
    minimum: 0,
    description: 'Maximum affordable minimum price in PHP',
  })
  @Transform(({ value }: { value: unknown }) => toNumber(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999.99)
  budget: number;

  @ApiPropertyOptional({ enum: PurposeCode })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(PurposeCode)
  purpose?: PurposeCode;

  @ApiPropertyOptional({
    type: String,
    example: 'WIFI,OUTLET',
    description:
      'Comma-separated amenity codes; every requested amenity is required.',
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) => toList(value))
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(Object.keys(AmenityCode).length)
  @IsEnum(AmenityCode, { each: true })
  amenities?: AmenityCode[];
}
