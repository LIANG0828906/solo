export type Vec2 = [number, number];

export interface GravitySource {
  id: string;
  position: Vec2;
  mass: number;
}

export function computeNetForce(position: Vec2, sources: GravitySource[]): Vec2 {
  let fx = 0;
  let fy = 0;

  for (const source of sources) {
    const dx = source.position[0] - position[0];
    const dy = source.position[1] - position[1];
    const r = Math.max(Math.sqrt(dx * dx + dy * dy), 0.5);
    const f = source.mass / (r * r);
    fx += f * (dx / r);
    fy += f * (dy / r);
  }

  return [fx, fy];
}

export function rk4Step(
  position: Vec2,
  velocity: Vec2,
  sources: GravitySource[],
  dt: number = 0.01
): { position: Vec2; velocity: Vec2 } {
  const a = (pos: Vec2): Vec2 => computeNetForce(pos, sources);

  const k1v = a(position);
  const k1x: Vec2 = [velocity[0], velocity[1]];

  const pos2: Vec2 = [
    position[0] + (dt / 2) * k1x[0],
    position[1] + (dt / 2) * k1x[1],
  ];
  const k2v = a(pos2);
  const k2x: Vec2 = [velocity[0] + (dt / 2) * k1v[0], velocity[1] + (dt / 2) * k1v[1]];

  const pos3: Vec2 = [
    position[0] + (dt / 2) * k2x[0],
    position[1] + (dt / 2) * k2x[1],
  ];
  const k3v = a(pos3);
  const k3x: Vec2 = [velocity[0] + (dt / 2) * k2v[0], velocity[1] + (dt / 2) * k2v[1]];

  const pos4: Vec2 = [
    position[0] + dt * k3x[0],
    position[1] + dt * k3x[1],
  ];
  const k4v = a(pos4);
  const k4x: Vec2 = [velocity[0] + dt * k3v[0], velocity[1] + dt * k3v[1]];

  const newPosition: Vec2 = [
    position[0] + (dt / 6) * (k1x[0] + 2 * k2x[0] + 2 * k3x[0] + k4x[0]),
    position[1] + (dt / 6) * (k1x[1] + 2 * k2x[1] + 2 * k3x[1] + k4x[1]),
  ];

  const newVelocity: Vec2 = [
    velocity[0] + (dt / 6) * (k1v[0] + 2 * k2v[0] + 2 * k3v[0] + k4v[0]),
    velocity[1] + (dt / 6) * (k1v[1] + 2 * k2v[1] + 2 * k3v[1] + k4v[1]),
  ];

  return { position: newPosition, velocity: newVelocity };
}

export function computePotential(position: Vec2, sources: GravitySource[]): number {
  let v = 0;

  for (const source of sources) {
    const dx = source.position[0] - position[0];
    const dy = source.position[1] - position[1];
    const r = Math.sqrt(dx * dx + dy * dy);
    v += -source.mass / r;
  }

  return v;
}

export function speedToColor(speed: number, maxSpeed: number): string {
  const t = Math.min(Math.max(speed / maxSpeed, 0), 1);
  const r = Math.round(0 + t * (255 - 0));
  const g = Math.round(102 + t * (51 - 102));
  const b = Math.round(255 + t * (0 - 255));
  return `rgb(${r}, ${g}, ${b})`;
}
