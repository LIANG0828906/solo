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

const VECTOR_ZERO = { x: 0, y: 0, z: 0 };

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

export function computeFieldAt(
  point: { x: number; y: number; z: number },
  magnets: MagnetData[]
): { x: number; y: number; z: number } {
  let field = { x: 0, y: 0, z: 0 };

  for (const magnet of magnets) {
    const dx = point.x - magnet.position.x;
    const dy = point.y - magnet.position.y;
    const dz = point.z - magnet.position.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    const dist = Math.sqrt(distSq);

    if (dist < 0.3) continue;

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
  magnets: MagnetData[]
): number {
  const field = computeFieldAt(point, magnets);
  return vecLength(field);
}

function traceFieldLine(
  startPoint: { x: number; y: number; z: number },
  direction: number,
  magnets: MagnetData[],
  sceneBounds: number,
  maxSteps: number = 300,
  stepSize: number = 0.15
): { points: { x: number; y: number; z: number }[]; strengths: number[] } {
  const points: { x: number; y: number; z: number }[] = [{ ...startPoint }];
  const strengths: number[] = [computeFieldStrength(startPoint, magnets)];

  let current = { ...startPoint };

  for (let i = 0; i < maxSteps; i++) {
    const field = computeFieldAt(current, magnets);
    const fieldLen = vecLength(field);

    if (fieldLen < 1e-6) break;

    const dir = vecNormalize(field);
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

    points.push({ ...current });
    strengths.push(fieldLen);
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
  const goldenRatioConjugate = 2 / (1 + Math.sqrt(5));

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

export function calculateFieldLines(
  magnets: MagnetData[],
  totalLineCount: number = 150,
  sceneBounds: number = 20
): FieldLineData[] {
  if (magnets.length === 0) return [];

  const nMagnets = magnets.filter((m) => m.polarity === 'N');
  const sMagnets = magnets.filter((m) => m.polarity === 'S');

  const totalStrength = magnets.reduce((sum, m) => sum + m.strength, 0);
  const lines: FieldLineData[] = [];

  const sourceMagnets = nMagnets.length > 0 ? nMagnets : sMagnets;
  const direction = nMagnets.length > 0 ? 1 : -1;

  const sourceStrength = sourceMagnets.reduce((sum, m) => sum + m.strength, 0);

  for (const magnet of sourceMagnets) {
    const magnetLineCount = Math.max(
      3,
      Math.round((magnet.strength / sourceStrength) * totalLineCount)
    );

    const startPoints = generateStartPoints(magnet, magnetLineCount, 0.4);

    for (const startPoint of startPoints) {
      const { points, strengths } = traceFieldLine(
        startPoint,
        direction,
        magnets,
        sceneBounds
      );

      if (points.length >= 3) {
        lines.push({
          points,
          fieldStrengths: strengths,
          magnetId: magnet.id,
        });
      }
    }
  }

  return lines.slice(0, totalLineCount);
}

export function adaptiveLineCount(magnetCount: number, baseCount: number = 150): number {
  const factor = Math.min(1, 1 + (magnetCount - 1) * 0.15);
  return Math.round(baseCount * factor);
}
