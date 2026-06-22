import type { CelestialBody, SimulationMode } from '../store/SimulationStore';

const G = 100;
const MIN_DISTANCE = 10;
const DT = 1 / 60;

export interface PhysicsConfig {
  mode: SimulationMode;
  speed: number;
  canvasWidth: number;
  canvasHeight: number;
}

function calculateGravity(body1: CelestialBody, body2: CelestialBody): { fx: number; fy: number } {
  const dx = body2.position.x - body1.position.x;
  const dy = body2.position.y - body1.position.y;
  const distanceSq = dx * dx + dy * dy;
  const distance = Math.sqrt(distanceSq);

  if (distance < MIN_DISTANCE) {
    return { fx: 0, fy: 0 };
  }

  const force = (G * body1.mass * body2.mass) / distanceSq;
  const fx = (force * dx) / distance;
  const fy = (force * dy) / distance;

  return { fx, fy };
}

function detectCollision(body1: CelestialBody, body2: CelestialBody): boolean {
  const dx = body2.position.x - body1.position.x;
  const dy = body2.position.y - body1.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < body1.radius + body2.radius;
}

function mergeBodies(body1: CelestialBody, body2: CelestialBody): CelestialBody {
  const totalMass = body1.mass + body2.mass;
  const newX = (body1.position.x * body1.mass + body2.position.x * body2.mass) / totalMass;
  const newY = (body1.position.y * body1.mass + body2.position.y * body2.mass) / totalMass;
  const newVx = (body1.velocity.x * body1.mass + body2.velocity.x * body2.mass) / totalMass;
  const newVy = (body1.velocity.y * body1.mass + body2.velocity.y * body2.mass) / totalMass;
  const newRadius = Math.pow(Math.pow(body1.radius, 3) + Math.pow(body2.radius, 3), 1 / 3);

  const primary = body1.mass >= body2.mass ? body1 : body2;

  return {
    ...primary,
    mass: totalMass,
    radius: newRadius,
    position: { x: newX, y: newY },
    velocity: { x: newVx, y: newVy },
    previousPosition: { x: newX, y: newY },
  };
}

function applyBoundary(body: CelestialBody, width: number, height: number): CelestialBody {
  const { position, velocity, radius } = body;
  let { x, y } = position;
  let { x: vx, y: vy } = velocity;

  if (x - radius < 0) {
    x = radius;
    vx = -vx * 0.8;
  } else if (x + radius > width) {
    x = width - radius;
    vx = -vx * 0.8;
  }

  if (y - radius < 0) {
    y = radius;
    vy = -vy * 0.8;
  } else if (y + radius > height) {
    y = height - radius;
    vy = -vy * 0.8;
  }

  return {
    ...body,
    position: { x, y },
    velocity: { x: vx, y: vy },
  };
}

function updateBodyWithVerlet(body: CelestialBody, ax: number, ay: number, dt: number, speed: number): CelestialBody {
  const { position, previousPosition } = body;
  const dtSq = dt * dt * speed * speed;

  const newX = position.x + (position.x - previousPosition.x) + ax * dtSq;
  const newY = position.y + (position.y - previousPosition.y) + ay * dtSq;

  const newVx = (newX - previousPosition.x) / (2 * dt);
  const newVy = (newY - previousPosition.y) / (2 * dt);

  return {
    ...body,
    position: { x: newX, y: newY },
    previousPosition: { x: position.x, y: position.y },
    velocity: { x: newVx, y: newVy },
  };
}

export function simulateStep(bodies: CelestialBody[], config: PhysicsConfig): CelestialBody[] {
  if (bodies.length < 1) return bodies;

  const { mode, speed, canvasWidth, canvasHeight } = config;
  const dt = DT;
  const numBodies = bodies.length;

  const accelerations: Array<{ ax: number; ay: number }> = new Array(numBodies).fill(0).map(() => ({ ax: 0, ay: 0 }));

  for (let i = 0; i < numBodies; i++) {
    for (let j = i + 1; j < numBodies; j++) {
      const { fx, fy } = calculateGravity(bodies[i], bodies[j]);
      accelerations[i].ax += fx / bodies[i].mass;
      accelerations[i].ay += fy / bodies[i].mass;
      accelerations[j].ax -= fx / bodies[j].mass;
      accelerations[j].ay -= fy / bodies[j].mass;
    }
  }

  let updatedBodies: CelestialBody[] = bodies.map((body, index) =>
    updateBodyWithVerlet(body, accelerations[index].ax, accelerations[index].ay, dt, speed)
  );

  if (mode === 'stable') {
    updatedBodies = updatedBodies.map((body) => applyBoundary(body, canvasWidth, canvasHeight));
  }

  const toRemove = new Set<number>();
  const mergedBodies: CelestialBody[] = [];

  for (let i = 0; i < updatedBodies.length; i++) {
    if (toRemove.has(i)) continue;

    let body = updatedBodies[i];

    for (let j = i + 1; j < updatedBodies.length; j++) {
      if (toRemove.has(j)) continue;

      if (detectCollision(body, updatedBodies[j])) {
        body = mergeBodies(body, updatedBodies[j]);
        toRemove.add(j);
      }
    }

    mergedBodies.push(body);
  }

  return mergedBodies;
}

export function calculateVelocityMagnitude(velocity: { x: number; y: number }): number {
  return Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
}

export function generateRandomPosition(width: number, height: number, margin: number = 50): { x: number; y: number } {
  return {
    x: margin + Math.random() * (width - 2 * margin),
    y: margin + Math.random() * (height - 2 * margin),
  };
}

export function generateOrbitalVelocity(
  centralMass: number,
  distance: number,
  clockwise: boolean = true
): { x: number; y: number } {
  const speed = Math.sqrt((G * centralMass) / distance);
  const angle = Math.random() * Math.PI * 2;
  const direction = clockwise ? 1 : -1;
  return {
    x: -Math.sin(angle) * speed * direction,
    y: Math.cos(angle) * speed * direction,
  };
}
