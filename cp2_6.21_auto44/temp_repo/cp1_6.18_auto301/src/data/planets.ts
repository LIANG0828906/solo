export interface PlanetData {
  id: string;
  name: string;
  nameCN: string;
  radius: number;
  color: string;
  orbitRadius: number;
  orbitPeriod: number;
  rotationPeriod: number;
  realOrbitRadius: number;
  realOrbitPeriod: number;
  satelliteCount: number;
  hasRings?: boolean;
}

export const PLANETS: PlanetData[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    nameCN: '水星',
    radius: 0.2,
    color: '#B5B5B5',
    orbitRadius: 4,
    orbitPeriod: 0.24,
    rotationPeriod: 58.6,
    realOrbitRadius: 57910000,
    realOrbitPeriod: 0.24,
    satelliteCount: 0,
  },
  {
    id: 'venus',
    name: 'Venus',
    nameCN: '金星',
    radius: 0.4,
    color: '#E8C77A',
    orbitRadius: 6,
    orbitPeriod: 0.62,
    rotationPeriod: 243,
    realOrbitRadius: 108200000,
    realOrbitPeriod: 0.62,
    satelliteCount: 0,
  },
  {
    id: 'earth',
    name: 'Earth',
    nameCN: '地球',
    radius: 0.5,
    color: '#4B9CD3',
    orbitRadius: 8.5,
    orbitPeriod: 1,
    rotationPeriod: 1,
    realOrbitRadius: 149600000,
    realOrbitPeriod: 1,
    satelliteCount: 1,
  },
  {
    id: 'mars',
    name: 'Mars',
    nameCN: '火星',
    radius: 0.4,
    color: '#C1440E',
    orbitRadius: 11,
    orbitPeriod: 1.88,
    rotationPeriod: 1.03,
    realOrbitRadius: 227940000,
    realOrbitPeriod: 1.88,
    satelliteCount: 2,
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    nameCN: '木星',
    radius: 1.5,
    color: '#D4A574',
    orbitRadius: 15,
    orbitPeriod: 11.86,
    rotationPeriod: 0.41,
    realOrbitRadius: 778330000,
    realOrbitPeriod: 11.86,
    satelliteCount: 95,
  },
  {
    id: 'saturn',
    name: 'Saturn',
    nameCN: '土星',
    radius: 1.2,
    color: '#E3DAC4',
    orbitRadius: 19,
    orbitPeriod: 29.46,
    rotationPeriod: 0.45,
    realOrbitRadius: 1429400000,
    realOrbitPeriod: 29.46,
    satelliteCount: 146,
    hasRings: true,
  },
  {
    id: 'uranus',
    name: 'Uranus',
    nameCN: '天王星',
    radius: 0.8,
    color: '#73B5D8',
    orbitRadius: 23,
    orbitPeriod: 84.01,
    rotationPeriod: 0.72,
    realOrbitRadius: 2870990000,
    realOrbitPeriod: 84.01,
    satelliteCount: 27,
  },
  {
    id: 'neptune',
    name: 'Neptune',
    nameCN: '海王星',
    radius: 0.7,
    color: '#3B5BA5',
    orbitRadius: 27,
    orbitPeriod: 164.8,
    rotationPeriod: 0.67,
    realOrbitRadius: 4504000000,
    realOrbitPeriod: 164.8,
    satelliteCount: 14,
  },
];

export function getPlanetById(id: string): PlanetData | undefined {
  return PLANETS.find((p) => p.id === id);
}
