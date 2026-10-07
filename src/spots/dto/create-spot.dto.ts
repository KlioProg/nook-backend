import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { AmenityCode, PurposeCode } from '../../generated/prisma/enums.js';

export class CreateSpotDto {
  @ApiProperty({ maxLength: 150 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name: string;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  description: string;

  @ApiProperty({ maxLength: 500 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  address: string;

  @ApiProperty({ example: 7.07, minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 125.61, minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: 80, minimum: 0, maximum: 99999999.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999.99)
  minPrice: number;

  @ApiProperty({ example: 200, minimum: 0, maximum: 99999999.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999.99)
  maxPrice: number;

  @ApiPropertyOptional({ default: true })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    enum: AmenityCode,
    isArray: true,
    example: ['WIFI', 'OUTLET'],
  })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(Object.keys(AmenityCode).length)
  @IsEnum(AmenityCode, { each: true })
  amenities: AmenityCode[];

  @ApiProperty({
    enum: PurposeCode,
    isArray: true,
    example: ['STUDY', 'CHILL'],
  })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(Object.keys(PurposeCode).length)
  @IsEnum(PurposeCode, { each: true })
  purposes: PurposeCode[];
}
