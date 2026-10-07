import { AmenityCode, PurposeCode } from '../src/generated/prisma/enums.js';

interface SampleSpot {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  minPrice: number;
  maxPrice: number;
  isActive: boolean;
  amenities: AmenityCode[];
  purposes: PurposeCode[];
}

// Fictional development fixtures around Jacinto/Roxas, not verified businesses.
export const sampleSpots: SampleSpot[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Sample Jacinto Study Cafe',
    description: 'Development sample: quiet tables for studying.',
    address: 'Sample address, Jacinto Street, Davao City',
    latitude: 7.071,
    longitude: 125.612,
    minPrice: 80,
    maxPrice: 200,
    isActive: true,
    amenities: ['WIFI', 'OUTLET', 'AIRCON', 'RESTROOM'],
    purposes: ['STUDY', 'GROUP_PROJECT', 'CHILL'],
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    name: 'Sample Roxas Coffee Corner',
    description: 'Development sample: a cafe for quick meetups.',
    address: 'Sample address, Roxas Avenue, Davao City',
    latitude: 7.073,
    longitude: 125.613,
    minPrice: 100,
    maxPrice: 250,
    isActive: true,
    amenities: ['WIFI', 'OUTLET', 'RESTROOM'],
    purposes: ['STUDY', 'HANGOUT', 'MEETING'],
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    name: 'Sample Budget Eatery',
    description: 'Development sample: affordable meals.',
    address: 'Sample address, Jacinto Street, Davao City',
    latitude: 7.072,
    longitude: 125.611,
    minPrice: 50,
    maxPrice: 120,
    isActive: true,
    amenities: ['RESTROOM'],
    purposes: ['QUICK_BITE', 'HANGOUT'],
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    name: 'Sample Open Garden',
    description: 'Development sample: a free outdoor resting area.',
    address: 'Sample address, Roxas area, Davao City',
    latitude: 7.074,
    longitude: 125.612,
    minPrice: 0,
    maxPrice: 0,
    isActive: true,
    amenities: ['PARKING'],
    purposes: ['CHILL', 'HANGOUT', 'DATE'],
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    name: 'Sample Project Lounge',
    description: 'Development sample: tables for group work.',
    address: 'Sample address, Ponciano area, Davao City',
    latitude: 7.076,
    longitude: 125.615,
    minPrice: 150,
    maxPrice: 300,
    isActive: true,
    amenities: ['WIFI', 'OUTLET', 'AIRCON', 'RESTROOM', 'PARKING'],
    purposes: ['STUDY', 'GROUP_PROJECT', 'MEETING', 'INTERVIEW'],
  },
  {
    id: '00000000-0000-4000-8000-000000000006',
    name: 'Sample Premium Workspace',
    description: 'Development sample: a higher priced workspace.',
    address: 'Sample address, downtown Davao City',
    latitude: 7.079,
    longitude: 125.615,
    minPrice: 250,
    maxPrice: 500,
    isActive: true,
    amenities: ['WIFI', 'OUTLET', 'AIRCON', 'RESTROOM'],
    purposes: ['STUDY', 'INTERVIEW', 'MEETING'],
  },
  {
    id: '00000000-0000-4000-8000-000000000007',
    name: 'Sample Wifi Snack Bar',
    description: 'Development sample: Wi-Fi, without outlets.',
    address: 'Sample address, Roxas Avenue, Davao City',
    latitude: 7.0705,
    longitude: 125.6105,
    minPrice: 60,
    maxPrice: 150,
    isActive: true,
    amenities: ['WIFI', 'RESTROOM'],
    purposes: ['STUDY', 'QUICK_BITE'],
  },
  {
    id: '00000000-0000-4000-8000-000000000008',
    name: 'Sample Inactive Cafe',
    description: 'Development sample: hidden from normal discovery.',
    address: 'Sample address, Jacinto area, Davao City',
    latitude: 7.07,
    longitude: 125.61,
    minPrice: 70,
    maxPrice: 180,
    isActive: false,
    amenities: ['WIFI', 'OUTLET'],
    purposes: ['STUDY', 'CHILL'],
  },
];
