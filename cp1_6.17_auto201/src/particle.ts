export interface Particle {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  mass: number;
  color: { r: number; g: number; b: number };
}

export interface ForceField {
  x: number;
  y: number;
  z: number;
  radius: number;
  strength: number;
  active: boolean;
}

export interface FusionEvent {
  x: number;
  y: number;
  z: number;
  time: number;
}

export interface RingEffect {
  x: number;
  y: number;
  z: number;
  color: { r: number; g: number; b: number };
  startTime: number;
  duration: number;
}

export const GRAVITY_CONSTANT = 6.674e-11;
export const REPULSION_THRESHOLD = 0.3;
export const MAX_REPULSION = 10;
export const PARTICLE_RADIUS = 0.025;

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 1, g: 1, b: 1 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

export function lerpColor(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return {
    r: c1.r + (c2.r - c1.r) * t,
    g: c1.g + (c2.g - c1.g) * t,
    b: c1.b + (c2.b - c1.b) * t,
  };
}

export function randomColorInRange(
  hexStart: string,
  hexEnd: string
): { r: number; g: number; b: number } {
  const c1 = hexToRgb(hexStart);
  const c2 = hexToRgb(hexEnd);
  const t = Math.random();
  return lerpColor(c1, c2, t);
}

export function randomPositionInSphere(radius: number): {
  x: number;
  y: number;
  z: number;
} {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = radius * Math.cbrt(Math.random());
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi),
  };
}

export function generateInitialParticles(
  count: number,
  sphereRadius: number
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const pos = randomPositionInSphere(sphereRadius);
    particles.push({
      id: i,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      vx: 0,
      vy: 0,
      vz: 0,
      mass: 1,
      color: randomColorInRange('#4A90D9', '#50E3C2'),
    });
  }
  return particles;
}

export function updateParticles(
  particles: Particle[],
  dt: number,
  forceField: ForceField | null,
  gravityScale: number
): { particles: Particle[]; fusions: FusionEvent[] } {
  const fusions: FusionEvent[] = [];
  const n = particles.length;
  const accelerations = new Float32Array(n * 3);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const p1 = particles[i];
      const p2 = particles[j];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dz = p2.z - p1.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const dist = Math.sqrt(distSq);

      if (dist < 0.0001) continue;

      const gravityForce = (GRAVITY_CONSTANT * p1.mass * p2.mass) / Math.max(distSq, 0.01);
      const gravityAccel = (gravityForce / p1.mass) * gravityScale;

      const invDist = 1 / dist;
      const fxG = dx * invDist * gravityAccel;
      const fyG = dy * invDist * gravityAccel;
      const fzG = dz * invDist * gravityAccel;

      accelerations[i * 3] += fxG;
      accelerations[i * 3 + 1] += fyG;
      accelerations[i * 3 + 2] += fzG;
      accelerations[j * 3] -= fxG;
      accelerations[j * 3 + 1] -= fyG;
      accelerations[j * 3 + 2] -= fzG;

      if (dist < REPULSION_THRESHOLD) {
        const t = 1 - dist / REPULSION_THRESHOLD;
        const repulsionForce = MAX_REPULSION * t * t;
        const fxR = dx * invDist * repulsionForce;
        const fyR = dy * invDist * repulsionForce;
        const fzR = dz * invDist * repulsionForce;
        accelerations[i * 3] -= fxR;
        accelerations[i * 3 + 1] -= fyR;
        accelerations[i * 3 + 2] -= fzR;
        accelerations[j * 3] += fxR;
        accelerations[j * 3 + 1] += fyR;
        accelerations[j * 3 + 2] += fzR;
      }
    }
  }

  if (forceField && forceField.active) {
    for (let i = 0; i < n; i++) {
      const p = particles[i];
      const dx = p.x - forceField.x;
      const dy = p.y - forceField.y;
      const dz = p.z - forceField.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const dist = Math.sqrt(distSq);

      if (dist < forceField.radius && dist > 0.001) {
        const t = 1 - dist / forceField.radius;
        const strength = forceField.strength * t;
        const invDist = 1 / dist;
        accelerations[i * 3] += dx * invDist * strength;
        accelerations[i * 3 + 1] += dy * invDist * strength;
        accelerations[i * 3 + 2] += dz * invDist * strength;
      }
    }
  }

  const toRemove = new Set<number>();
  const newParticles: Particle[] = [];

  for (let i = 0; i < n; i++) {
    if (toRemove.has(i)) continue;

    const p = particles[i];
    p.vx += accelerations[i * 3] * dt;
    p.vy += accelerations[i * 3 + 1] * dt;
    p.vz += accelerations[i * 3 + 2] * dt;

    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy + p.vz * p.vz);
    if (speed > 5) {
      const scale = 5 / speed;
      p.vx *= scale;
      p.vy *= scale;
      p.vz *= scale;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;

    for (let j = i + 1; j < n; j++) {
      if (toRemove.has(j)) continue;
      const p2 = particles[j];
      const dx = p2.x - p.x;
      const dy = p2.y - p.y;
      const dz = p2.z - p.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < 0.0009) {
        toRemove.add(j);
        const totalMass = p.mass + p2.mass;
        p.x = (p.x * p.mass + p2.x * p2.mass) / totalMass;
        p.y = (p.y * p.mass + p2.y * p2.mass) / totalMass;
        p.z = (p.z * p.mass + p2.z * p2.mass) / totalMass;
        p.vx = (p.vx * p.mass + p2.vx * p2.mass) / totalMass;
        p.vy = (p.vy * p.mass + p2.vy * p2.mass) / totalMass;
        p.vz = (p.vz * p.mass + p2.vz * p2.mass) / totalMass;
        p.mass = totalMass;
        p.color = lerpColor(p.color, p2.color, p2.mass / totalMass);
        fusions.push({ x: p.x, y: p.y, z: p.z, time: performance.now() });
        break;
      }
    }

    if (!toRemove.has(i)) {
      newParticles.push(p);
    }
  }

  return { particles: newParticles, fusions };
}
