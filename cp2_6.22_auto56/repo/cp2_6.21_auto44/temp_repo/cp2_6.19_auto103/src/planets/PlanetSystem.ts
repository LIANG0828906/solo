export type TextureType = 'sun' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'gas' | 'rocky' | 'ice';

export interface PlanetData {
  name: string;
  color: number;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  textureType: TextureType;
  mass: string;
  realRadius: number;
  orbitalPeriod: number;
  rotationPeriod: number;
  satellites: number;
}

const PLANETS: PlanetData[] = [
  {
    name: '水星',
    color: 0x8c7853,
    radius: 0.38,
    orbitRadius: 3,
    orbitSpeed: 0.0479,
    rotationSpeed: 0.017,
    textureType: 'rocky',
    mass: '3.3011 × 10²³',
    realRadius: 2439.7,
    orbitalPeriod: 87.97,
    rotationPeriod: 1407.6,
    satellites: 0,
  },
  {
    name: '金星',
    color: 0xffc649,
    radius: 0.95,
    orbitRadius: 5,
    orbitSpeed: 0.0350,
    rotationSpeed: -0.004,
    textureType: 'rocky',
    mass: '4.8675 × 10²⁴',
    realRadius: 6051.8,
    orbitalPeriod: 224.7,
    rotationPeriod: 5832.5,
    satellites: 0,
  },
  {
    name: '地球',
    color: 0x6b93d6,
    radius: 1.0,
    orbitRadius: 7,
    orbitSpeed: 0.0298,
    rotationSpeed: 0.02,
    textureType: 'earth',
    mass: '5.9724 × 10²⁴',
    realRadius: 6371,
    orbitalPeriod: 365.25,
    rotationPeriod: 23.93,
    satellites: 1,
  },
  {
    name: '火星',
    color: 0xc1440e,
    radius: 0.53,
    orbitRadius: 10,
    orbitSpeed: 0.0241,
    rotationSpeed: 0.018,
    textureType: 'mars',
    mass: '6.4171 × 10²³',
    realRadius: 3389.5,
    orbitalPeriod: 686.98,
    rotationPeriod: 24.62,
    satellites: 2,
  },
  {
    name: '木星',
    color: 0xd8ca9d,
    radius: 2.5,
    orbitRadius: 14,
    orbitSpeed: 0.0131,
    rotationSpeed: 0.045,
    textureType: 'jupiter',
    mass: '1.8982 × 10²⁷',
    realRadius: 69911,
    orbitalPeriod: 4332.59,
    rotationPeriod: 9.93,
    satellites: 95,
  },
  {
    name: '土星',
    color: 0xfad5a5,
    radius: 2.1,
    orbitRadius: 18,
    orbitSpeed: 0.0097,
    rotationSpeed: 0.038,
    textureType: 'saturn',
    mass: '5.6834 × 10²⁶',
    realRadius: 58232,
    orbitalPeriod: 10759.22,
    rotationPeriod: 10.66,
    satellites: 146,
  },
  {
    name: '天王星',
    color: 0x4fd0e7,
    radius: 1.5,
    orbitRadius: 23,
    orbitSpeed: 0.0068,
    rotationSpeed: -0.03,
    textureType: 'ice',
    mass: '8.6810 × 10²⁵',
    realRadius: 25362,
    orbitalPeriod: 30688.5,
    rotationPeriod: 17.24,
    satellites: 28,
  },
  {
    name: '海王星',
    color: 0x4166f5,
    radius: 1.45,
    orbitRadius: 30,
    orbitSpeed: 0.0054,
    rotationSpeed: 0.032,
    textureType: 'ice',
    mass: '1.02413 × 10²⁶',
    realRadius: 24622,
    orbitalPeriod: 60182,
    rotationPeriod: 16.11,
    satellites: 16,
  },
];

export function getPlanets(): PlanetData[] {
  return PLANETS.map((p) => ({ ...p }));
}

export function getPlanetByName(name: string): PlanetData | undefined {
  return PLANETS.find((p) => p.name === name);
}
