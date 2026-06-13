export interface MagnetData {
  id: string;
  position: { x: number; y: number; z: number };
  polarity: 'N' | 'S';
  strength: number;
}

export interface FieldLineData {
  points: { x: number; y: number; z: number }[];
  fieldStrengths: number[];
  magnetId: string;
}

class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, MagnetData[]> = new Map();
  private magnets: MagnetData[] = [];
  private bounds: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };

  constructor(magnets: MagnetData[], cellSize: number = 5) {
    this.cellSize = cellSize;
    this.magnets = magnets;
    this.bounds = this.calculateBounds();
    this.buildGrid();
  }

  private calculateBounds() {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const m of this.magnets) {
      minX = Math.min(minX, m.position.x);
      minY = Math.min(minY, m.position.y);
      minZ = Math.min(minZ, m.position.z);
      maxX = Math.max(maxX, m.position.x);
      maxY = Math.max(maxY, m.position.y);
      maxZ = Math.max(maxZ, m.position.z);
    }

    return {
      min: { x: minX - 2, y: minY - 2, z: minZ - 2 },
      max: { x: maxX + 2, y: maxY + 2, z: maxZ + 2 },
    };
  }

  private getKey(x: number, y: number, z: number): string {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)},${Math.floor(z / this.cellSize)}`;
  }

  private buildGrid() {
    for (const magnet of this.magnets) {
      const key = this.getKey(
        magnet.position.x,
        magnet.position.y,
        magnet.position.z
      );
      if (!this.grid.has(key)) {
        this.grid.set(key, []);
      }
      this.grid.get(key)!.push(magnet);
    }
  }

  public getNearbyMagnets(
    point: { x: number; y: number; z: number },
    maxDistance: number
  ): MagnetData[] {
    if (this.magnets.length <= 3) return this.magnets;

    const nearby: MagnetData[] = [];
    const searchRadius = Math.ceil(maxDistance / this.cellSize);

    const baseX = Math.floor(point.x / this.cellSize);
    const baseY = Math.floor(point.y / this.cellSize);
    const baseZ = Math.floor(point.z / this.cellSize);

    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
      for (let dy = -searchRadius; dy <= searchRadius; dy++) {
        for (let dz = -searchRadius; dz <= searchRadius; dz++) {
          const key = `${baseX + dx},${baseY + dy},${baseZ + dz}`;
          const cell = this.grid.get(key);
          if (cell) {
            for (const magnet of cell) {
              const dist = Math.sqrt(
                Math.pow(point.x - magnet.position.x, 2) +
                Math.pow(point.y - magnet.position.y, 2) +
                Math.pow(point.z - magnet.position.z, 2)
              );
              if (dist <= maxDistance) {
                nearby.push(magnet);
              }
            }
          }
        }
      }
    }

    for (const magnet of this.magnets) {
      if (magnet.strength >= 8 && !nearby.includes(magnet)) {
        nearby.push(magnet);
      }
    }

    return nearby.length > 0 ? nearby : this.magnets;
  }
}

function vecAdd(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function vecScale(v: { x: number; y: number; z: number }, s: number) {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function vecLength(v: { x: number; y: number; z: number }) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function vecNormalize(v: { x: number; y: number; z: number }) {
  const len = vecLength(v);
  if (len < 1e-10) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function vecDistance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

const INFLUENCE_CUTOFF = 12;
const MIN_STEP_SIZE = 0.08;
const MAX_STEP_SIZE = 0.25;

export function computeFieldAt(
  point: { x: number; y: number; z: number },
  magnets: MagnetData[],
  spatialGrid?: SpatialGrid
): { x: number; y: number; z: number } {
  let field = { x: 0, y: 0, z: 0 };

  const nearbyMagnets = spatialGrid
    ? spatialGrid.getNearbyMagnets(point, INFLUENCE_CUTOFF)
    : magnets;

  for (const magnet of nearbyMagnets) {
    const dx = point.x - magnet.position.x;
    const dy = point.y - magnet.position.y;
    const dz = point.z - magnet.position.z;
    const distSq = dx * dx + dy * dy + dz * dz;

    if (distSq < 0.09) continue;

    const dist = Math.sqrt(distSq);

    if (dist > INFLUENCE_CUTOFF && magnet.strength < 8) continue;

    const distCubed = distSq * dist;
    const magnitude = magnet.strength / distCubed;
    const sign = magnet.polarity === 'N' ? 1 : -1;

    field.x += sign * magnitude * dx;
    field.y += sign * magnitude * dy;
    field.z += sign * magnitude * dz;
  }

  return field;
}

export function computeFieldStrength(
  point: { x: number; y: number; z: number },
  magnets: MagnetData[],
  spatialGrid?: SpatialGrid
): number {
  const field = computeFieldAt(point, magnets, spatialGrid);
  return vecLength(field);
}

function adaptiveStepSize(fieldStrength: number): number {
  if (fieldStrength < 0.01) return MAX_STEP_SIZE;
  if (fieldStrength > 10) return MIN_STEP_SIZE;
  return MIN_STEP_SIZE + (MAX_STEP_SIZE - MIN_STEP_SIZE) * (1 - Math.min(1, fieldStrength / 10));
}

function traceFieldLine(
  startPoint: { x: number; y: number; z: number },
  direction: number,
  magnets: MagnetData[],
  spatialGrid: SpatialGrid,
  sceneBounds: number,
  maxSteps: number = 300
): { points: { x: number; y: number; z: number }[]; strengths: number[] } {
  const points: { x: number; y: number; z: number }[] = [{ ...startPoint }];
  const strengths: number[] = [computeFieldStrength(startPoint, magnets, spatialGrid)];

  let current = { ...startPoint };
  let currentStrength = strengths[0];

  for (let i = 0; i < maxSteps; i++) {
    const field = computeFieldAt(current, magnets, spatialGrid);
    const fieldLen = vecLength(field);

    if (fieldLen < 1e-6) break;

    const dir = vecNormalize(field);
    const stepSize = adaptiveStepSize(currentStrength);
    const step = vecScale(dir, stepSize * direction);
    current = vecAdd(current, step);

    if (
      Math.abs(current.x) > sceneBounds ||
      Math.abs(current.y) > sceneBounds ||
      Math.abs(current.z) > sceneBounds
    ) {
      break;
    }

    let tooClose = false;
    for (const magnet of magnets) {
      if (vecDistance(current, magnet.position) < 0.35) {
        tooClose = true;
        break;
      }
    }
    if (tooClose && i > 5) break;

    currentStrength = fieldLen;
    points.push({ ...current });
    strengths.push(currentStrength);
  }

  return { points, strengths };
}

function generateStartPoints(
  magnet: MagnetData,
  count: number,
  radius: number = 0.4
): { x: number; y: number; z: number }[] {
  const points: { x: number; y: number; z: number }[] = [];
  const phiStep = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phiStep * i;

    const x = Math.cos(theta) * radiusAtY * radius;
    const z = Math.sin(theta) * radiusAtY * radius;
    const yPos = y * radius;

    points.push({
      x: magnet.position.x + x,
      y: magnet.position.y + yPos,
      z: magnet.position.z + z,
    });
  }

  return points;
}

function simplifyLine(
  points: { x: number; y: number; z: number }[],
  strengths: number[],
  tolerance: number = 0.05
): { points: { x: number; y: number; z: number }[]; strengths: number[] } {
  if (points.length <= 30) return { points, strengths };

  const simplifiedPoints: { x: number; y: number; z: number }[] = [points[0]];
  const simplifiedStrengths: number[] = [strengths[0]];

  let lastKeptIndex = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const dist = vecDistance(points[lastKeptIndex], points[i]);
    const strengthDiff = Math.abs(strengths[lastKeptIndex] - strengths[i]);

    if (dist > 0.2 || strengthDiff > 0.5) {
      simplifiedPoints.push(points[i]);
      simplifiedStrengths.push(strengths[i]);
      lastKeptIndex = i;
    }
  }

  simplifiedPoints.push(points[points.length - 1]);
  simplifiedStrengths.push(strengths[strengths.length - 1]);

  return { points: simplifiedPoints, strengths: simplifiedStrengths };
}

export function calculateFieldLines(
  magnets: MagnetData[],
  totalLineCount: number = 150,
  sceneBounds: number = 20
): FieldLineData[] {
  if (magnets.length === 0) return [];

  const optimizedLineCount = adaptiveLineCount(magnets.length, totalLineCount);
  const spatialGrid = new SpatialGrid(magnets, 4);

  const nMagnets = magnets.filter((m) => m.polarity === 'N');
  const sMagnets = magnets.filter((m) => m.polarity === 'S');

  const lines: FieldLineData[] = [];

  const sourceMagnets = nMagnets.length > 0 ? nMagnets : sMagnets;
  const direction = nMagnets.length > 0 ? 1 : -1;

  const sourceStrength = sourceMagnets.reduce((sum, m) => sum + m.strength, 0);

  for (const magnet of sourceMagnets) {
    const magnetLineCount = Math.max(
      3,
      Math.round((magnet.strength / sourceStrength) * optimizedLineCount)
    );

    const startPoints = generateStartPoints(magnet, magnetLineCount, 0.4);

    for (const startPoint of startPoints) {
      const { points, strengths } = traceFieldLine(
        startPoint,
        direction,
        magnets,
        spatialGrid,
        sceneBounds
      );

      if (points.length >= 3) {
        const simplified = simplifyLine(points, strengths, 0.05);
        lines.push({
          points: simplified.points,
          fieldStrengths: simplified.strengths,
          magnetId: magnet.id,
        });
      }
    }
  }

  return lines.slice(0, optimizedLineCount);
}

export function adaptiveLineCount(magnetCount: number, baseCount: number = 150): number {
  const baseLines = Math.max(80, baseCount - (magnetCount - 1) * 15);
  const strengthFactor = Math.min(1, 0.6 + magnetCount * 0.1);
  return Math.round(baseLines * strengthFactor);
}
