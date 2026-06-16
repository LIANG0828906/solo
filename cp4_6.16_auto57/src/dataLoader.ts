export interface CelestialBody {
  id: string;
  name: string;
  type: 'star' | 'planet' | 'nebula';
  position: [number, number, number];
  color: string;
  colorDesc: string;
  size: number;
  temperature: number;
  distanceFromSun: number;
  parentStarId?: string;
  orbitRadius?: number;
  orbitSpeed?: number;
  initialAngle?: number;
}

interface RawCelestialBody {
  id: string;
  name: string;
  type?: 'star' | 'planet' | 'nebula';
  position: number[];
  color: string;
  colorDesc: string;
  size: number;
  temperature: number;
  distanceFromSun: number;
  parentStarId?: string;
  orbitRadius?: number;
  orbitSpeed?: number;
  initialAngle?: number;
}

function normalizeNumber(value: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function inferTypeFromId(id: string): 'star' | 'planet' | 'nebula' {
  if (id.startsWith('star_')) return 'star';
  if (id.startsWith('planet_')) return 'planet';
  return 'nebula';
}

function normalizePosition(position: number[]): [number, number, number] {
  const x = normalizeNumber(position?.[0], 0);
  const y = normalizeNumber(position?.[1], 0);
  const z = normalizeNumber(position?.[2], 0);
  return [x, y, z];
}

export async function loadGalaxyData(): Promise<CelestialBody[]> {
  const module = await import('./data/galaxyData.json', { assert: { type: 'json' } });
  const rawData: RawCelestialBody[] = module.default as RawCelestialBody[];

  return rawData.map((raw): CelestialBody => ({
    id: raw.id ?? '',
    name: raw.name ?? '',
    type: raw.type ?? inferTypeFromId(raw.id ?? ''),
    position: normalizePosition(raw.position ?? []),
    color: raw.color ?? '#ffffff',
    colorDesc: raw.colorDesc ?? '',
    size: normalizeNumber(raw.size, 1),
    temperature: normalizeNumber(raw.temperature, 0),
    distanceFromSun: normalizeNumber(raw.distanceFromSun, 0),
    parentStarId: raw.parentStarId,
    orbitRadius: raw.orbitRadius !== undefined ? normalizeNumber(raw.orbitRadius, 0) : undefined,
    orbitSpeed: raw.orbitSpeed !== undefined ? normalizeNumber(raw.orbitSpeed, 0) : undefined,
    initialAngle: raw.initialAngle !== undefined ? normalizeNumber(raw.initialAngle, 0) : undefined,
  }));
}
