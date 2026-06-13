export interface StarData {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  mass: number;
  galaxy: 0 | 1;
}

export interface GalaxyParams {
  starCount: number;
  morphology: 'spiral' | 'elliptical';
  rotation: 'cw' | 'ccw';
}

export interface SimulationParams {
  collisionAngle: number;
  relativeSpeed: number;
}

const GALAXY_SEPARATION = 200;
const GALAXY_RADIUS = 60;

function gaussianRandom(mean = 0, std = 1): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function generateGalaxyStars(
  count: number,
  morphology: 'spiral' | 'elliptical',
  rotation: 'cw' | 'ccw',
  centerX: number,
  centerY: number,
  centerZ: number,
  galaxyId: 0 | 1
): StarData[] {
  const stars: StarData[] = [];
  const rotSign = rotation === 'cw' ? -1 : 1;

  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;
    const mass = 0.8 + Math.random() * 2.4;

    if (morphology === 'spiral') {
      const armCount = 4;
      const r = Math.abs(gaussianRandom(0, GALAXY_RADIUS * 0.4));
      const clampedR = Math.min(r, GALAXY_RADIUS);
      const baseAngle = (i % armCount) * (2 * Math.PI / armCount);
      const twist = clampedR * 0.06;
      const angle = baseAngle + twist + gaussianRandom(0, 0.25);
      const heightNoise = gaussianRandom(0, 3);

      x = Math.cos(angle) * clampedR + gaussianRandom(0, 4);
      z = Math.sin(angle) * clampedR + gaussianRandom(0, 4);
      y = heightNoise;

      const tangentAngle = angle + Math.PI / 2;
      const softening = 2;
      const K = 5;
      const orbitalSpeed = K / Math.sqrt(clampedR + softening);
      const vx = rotSign * Math.cos(tangentAngle) * orbitalSpeed + gaussianRandom(0, 0.3);
      const vz = rotSign * Math.sin(tangentAngle) * orbitalSpeed + gaussianRandom(0, 0.3);
      const vy = gaussianRandom(0, 0.3);
      const radialDispersion = gaussianRandom(0, 0.15 * orbitalSpeed);

      stars.push({
        x: x + centerX, y: y + centerY, z: z + centerZ,
        vx: vx + radialDispersion * Math.cos(angle),
        vy,
        vz: vz + radialDispersion * Math.sin(angle),
        mass, galaxy: galaxyId,
      });
    } else {
      const r = Math.abs(gaussianRandom(0, GALAXY_RADIUS * 0.35));
      const clampedR = Math.min(r, GALAXY_RADIUS);
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      x = clampedR * Math.sin(phi) * Math.cos(theta);
      y = clampedR * Math.sin(phi) * Math.sin(theta) * 0.6;
      z = clampedR * Math.cos(phi);

      const dist = Math.sqrt(x * x + y * y + z * z);
      const xzDist = Math.sqrt(x * x + z * z);
      const softening = 2;
      const K = 5;
      const orbitalSpeed = K / Math.sqrt(dist + softening);
      let tangentX = 0;
      let tangentZ = 0;
      if (xzDist > 1e-6) {
        tangentX = -z / xzDist;
        tangentZ = x / xzDist;
      }
      const vx = rotSign * tangentX * orbitalSpeed;
      const vz = rotSign * tangentZ * orbitalSpeed;
      const vy = gaussianRandom(0, 0.2 * orbitalSpeed);
      const dispersion = 0.2 * orbitalSpeed;

      stars.push({
        x: x + centerX, y: y + centerY, z: z + centerZ,
        vx: vx + gaussianRandom(0, dispersion),
        vy,
        vz: vz + gaussianRandom(0, dispersion),
        mass, galaxy: galaxyId,
      });
    }
  }
  return stars;
}

export function generateGalaxies(
  paramsA: GalaxyParams,
  paramsB: GalaxyParams,
  simParams: SimulationParams
): StarData[] {
  const angleRad = (simParams.collisionAngle * Math.PI) / 180;
  const speed = simParams.relativeSpeed;

  const starsA = generateGalaxyStars(
    paramsA.starCount, paramsA.morphology, paramsA.rotation,
    -GALAXY_SEPARATION / 2, 0, 0, 0
  );
  const starsB = generateGalaxyStars(
    paramsB.starCount, paramsB.morphology, paramsB.rotation,
    GALAXY_SEPARATION / 2, 0, 0, 1
  );

  const dvx = Math.cos(angleRad) * speed;
  const dvy = 0;
  const dvz = Math.sin(angleRad) * speed;

  for (const s of starsA) {
    s.vx += dvx / 2;
    s.vy += dvy / 2;
    s.vz += dvz / 2;
  }
  for (const s of starsB) {
    s.vx -= dvx / 2;
    s.vy -= dvy / 2;
    s.vz -= dvz / 2;
  }

  return [...starsA, ...starsB];
}
