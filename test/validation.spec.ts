import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { DiscoveryQueryDto } from '../src/discovery/dto/discovery-query.dto.js';
import { SpotQueryDto } from '../src/spots/dto/spot-query.dto.js';
import { UpdateSpotDto } from '../src/spots/dto/update-spot.dto.js';

const valid = {
  latitude: '7.07',
  longitude: '125.61',
  availableMinutes: '120',
  budget: '150',
  purpose: 'STUDY',
  amenities: 'WIFI,OUTLET',
};

describe('request validation', () => {
  it('transforms discovery numbers and comma-separated amenities', async () => {
    const dto = plainToInstance(DiscoveryQueryDto, valid);
    expect(await validate(dto)).toEqual([]);
    expect(dto).toMatchObject({
      latitude: 7.07,
      budget: 150,
      amenities: ['WIFI', 'OUTLET'],
      page: 1,
      limit: 20,
    });
  });

  it.each([
    { latitude: '91' },
    { longitude: '-181' },
    { latitude: '' },
    { latitude: 'NaN' },
    { budget: '-1' },
    { budget: '' },
    { availableMinutes: '0' },
    { availableMinutes: '-1' },
    { purpose: 'INVALID' },
    { amenities: 'WIFI,INVALID' },
    { amenities: 'WIFI,WIFI' },
    { amenities: '' },
    { limit: '101' },
    { page: '0' },
    { latitude: ['7', '8'] },
  ])('rejects invalid discovery inputs (%j)', async (invalid) => {
    expect(
      (
        await validate(
          plainToInstance(DiscoveryQueryDto, { ...valid, ...invalid }),
        )
      ).length,
    ).toBeGreaterThan(0);
  });

  it('handles false boolean queries without truthy string coercion', async () => {
    const dto = plainToInstance(SpotQueryDto, { isActive: 'false' });
    expect(await validate(dto)).toEqual([]);
    expect(dto.isActive).toBe(false);
    expect(
      (await validate(plainToInstance(SpotQueryDto, { isActive: 'yes' })))
        .length,
    ).toBeGreaterThan(0);
  });

  it('allows an empty patch but rejects explicit null values', async () => {
    expect(await validate(plainToInstance(UpdateSpotDto, {}))).toEqual([]);
    for (const field of [
      'name',
      'latitude',
      'minPrice',
      'amenities',
      'purposes',
      'isActive',
    ]) {
      expect(
        (await validate(plainToInstance(UpdateSpotDto, { [field]: null })))
          .length,
      ).toBeGreaterThan(0);
    }
  });
});
