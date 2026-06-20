import type { Hero } from './heroManager';

export interface CollisionEvent {
  position: { x: number; z: number };
  timestamp: number;
}

let heroesRef: Hero[] = [];
let arenaRadiusRef: number = 8;
let eliminationRadiusRef: number = 9;
let simulationActiveRef: boolean = false;
let collisionCountRef: number = 0;
const allAgileRef: { value: boolean } = { value: false };

export function init(heroes: Hero[], arenaRadius: number = 8): void {
  heroesRef = heroes;
  arenaRadiusRef = arenaRadius;
  eliminationRadiusRef = arenaRadius + 1;
  collisionCountRef = 0;
  simulationActiveRef = false;

  heroes.forEach(hero => {
    hero.velocity = { x: 0, z: 0 };
  });
}

export function setAllAgile(value: boolean): void {
  allAgileRef.value = value;
}

export function setSimulationActive(active: boolean): void {
  simulationActiveRef = active;
}

export function getCollisionCount(): number {
  return collisionCountRef;
}

export function getAliveHeroes(): Hero[] {
  return heroesRef.filter(h => h.isAlive);
}

function normalize(vx: number, vz: number): { x: number; z: number } {
  const len = Math.sqrt(vx * vx + vz * vz);
  if (len === 0) return { x: 0, z: 0 };
  return { x: vx / len, z: vz / len };
}

function setDirectionTowardCenter(hero: Hero): void {
  const speed = hero.baseSpeed * (allAgileRef.value ? 1.3 : 1.0);
  const dir = normalize(-hero.position.x, -hero.position.z);
  hero.velocity.x = dir.x * speed;
  hero.velocity.z = dir.z * speed;
}

function resolveBoundaryCollision(hero: Hero): void {
  const dist = Math.sqrt(hero.position.x ** 2 + hero.position.z ** 2);

  if (dist > eliminationRadiusRef) {
    hero.isAlive = false;
    return;
  }

  if (dist + hero.radius > arenaRadiusRef) {
    const nx = hero.position.x / dist;
    const nz = hero.position.z / dist;

    const pushBack = (dist + hero.radius - arenaRadiusRef) + 0.01;
    hero.position.x -= nx * pushBack;
    hero.position.z -= nz * pushBack;

    const dot = hero.velocity.x * nx + hero.velocity.z * nz;
    hero.velocity.x -= 2 * dot * nx;
    hero.velocity.z -= 2 * dot * nz;

    const speed = Math.sqrt(hero.velocity.x ** 2 + hero.velocity.z ** 2);
    const targetSpeed = hero.baseSpeed * (allAgileRef.value ? 1.3 : 1.0);
    if (speed > 0) {
      hero.velocity.x = (hero.velocity.x / speed) * targetSpeed;
      hero.velocity.z = (hero.velocity.z / speed) * targetSpeed;
    }
  }
}

function resolveHeroCollision(a: Hero, b: Hero): CollisionEvent | null {
  const dx = b.position.x - a.position.x;
  const dz = b.position.z - a.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const minDist = a.radius + b.radius;

  if (dist >= minDist || dist === 0) return null;

  const nx = dx / dist;
  const nz = dz / dist;

  const overlap = (minDist - dist) / 2 + 0.005;
  a.position.x -= nx * overlap;
  a.position.z -= nz * overlap;
  b.position.x += nx * overlap;
  b.position.z += nz * overlap;

  const rvx = b.velocity.x - a.velocity.x;
  const rvz = b.velocity.z - a.velocity.z;
  const velAlongNormal = rvx * nx + rvz * nz;

  if (velAlongNormal > 0) return null;

  const ma = a.radius * a.radius;
  const mb = b.radius * b.radius;
  const impulse = (2 * velAlongNormal) / (ma + mb);

  a.velocity.x += impulse * mb * nx;
  a.velocity.z += impulse * mb * nz;
  b.velocity.x -= impulse * ma * nx;
  b.velocity.z -= impulse * ma * nz;

  const speedA = Math.sqrt(a.velocity.x ** 2 + a.velocity.z ** 2);
  const speedB = Math.sqrt(b.velocity.x ** 2 + b.velocity.z ** 2);
  const targetSpeedA = a.baseSpeed * (allAgileRef.value ? 1.3 : 1.0);
  const targetSpeedB = b.baseSpeed * (allAgileRef.value ? 1.3 : 1.0);

  if (speedA > 0) {
    const boost = Math.max(targetSpeedA / speedA, 1.0);
    a.velocity.x *= boost;
    a.velocity.z *= boost;
  }
  if (speedB > 0) {
    const boost = Math.max(targetSpeedB / speedB, 1.0);
    b.velocity.x *= boost;
    b.velocity.z *= boost;
  }

  collisionCountRef++;

  return {
    position: {
      x: (a.position.x + b.position.x) / 2,
      z: (a.position.z + b.position.z) / 2
    },
    timestamp: performance.now()
  };
}

export function update(deltaTime: number): CollisionEvent[] {
  const collisions: CollisionEvent[] = [];
  const aliveHeroes = heroesRef.filter(h => h.isAlive);

  if (simulationActiveRef) {
    aliveHeroes.forEach(hero => {
      const speed = Math.sqrt(hero.velocity.x ** 2 + hero.velocity.z ** 2);
      const targetSpeed = hero.baseSpeed * (allAgileRef.value ? 1.3 : 1.0);

      if (speed < targetSpeed * 0.3) {
        setDirectionTowardCenter(hero);
      } else {
        const targetDir = normalize(-hero.position.x, -hero.position.z);
        const blendFactor = 0.02;
        hero.velocity.x += targetDir.x * targetSpeed * blendFactor;
        hero.velocity.z += targetDir.z * targetSpeed * blendFactor;

        const currentSpeed = Math.sqrt(hero.velocity.x ** 2 + hero.velocity.z ** 2);
        if (currentSpeed > 0) {
          const maxSpeed = targetSpeed * 1.5;
          if (currentSpeed > maxSpeed) {
            hero.velocity.x = (hero.velocity.x / currentSpeed) * maxSpeed;
            hero.velocity.z = (hero.velocity.z / currentSpeed) * maxSpeed;
          }
        }
      }
    });
  }

  aliveHeroes.forEach(hero => {
    if (hero.velocity.x !== 0 || hero.velocity.z !== 0) {
      hero.position.x += hero.velocity.x * deltaTime;
      hero.position.z += hero.velocity.z * deltaTime;
    }
  });

  aliveHeroes.forEach(hero => {
    resolveBoundaryCollision(hero);
  });

  for (let i = 0; i < aliveHeroes.length; i++) {
    for (let j = i + 1; j < aliveHeroes.length; j++) {
      if (!aliveHeroes[i].isAlive || !aliveHeroes[j].isAlive) continue;
      const collision = resolveHeroCollision(aliveHeroes[i], aliveHeroes[j]);
      if (collision) {
        collisions.push(collision);
      }
    }
  }

  return collisions;
}
