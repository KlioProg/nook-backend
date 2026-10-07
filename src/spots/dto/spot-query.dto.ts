import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { toBoolean, toNumber } from '../../common/utils/query-transforms.js';
import { AmenityCode, PurposeCode } from '../../generated/prisma/enums.js';

export class SpotQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Lowest price in the requested range (PHP)',
    minimum: 0,
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) => toNumber(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999.99)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Highest price in the requested range (PHP)',
    minimum: 0,
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) => toNumber(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999.99)
  maxPrice?: number;

  @ApiPropertyOptional({ enum: PurposeCode })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(PurposeCode)
  purpose?: PurposeCode;

  @ApiPropertyOptional({ enum: AmenityCode })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(AmenityCode)
  amenity?: AmenityCode;

  @ApiPropertyOptional({ default: true })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) => toBoolean(value))
  @IsBoolean()
  isActive?: boolean;
}
