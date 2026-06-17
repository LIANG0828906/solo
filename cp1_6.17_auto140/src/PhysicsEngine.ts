import { Star, Galaxy, GalaxyState, SupernovaParticle, CollisionEvent } from './GalaxyState';

const GRAVITY_CONSTANT = 50;
const COLLISION_THRESHOLD = 8;
const SUPERNOVA_COUNT_MIN = 20;
const SUPERNOVA_COUNT_MAX = 40;
const SUPERNOVA_SPEED = 3;
const SUPERNOVA_LIFETIME = 120;
const HALO_DURATION = 30;
const TRAIL_LENGTH_BASE = 15;
const TRAIL_LENGTH_MIN = 6;
const DT = 0.05;

export function updateGalaxies(
  state: GalaxyState,
  deltaTime: number,
  isPaused: boolean,
  draggedGalaxyId: string | null,
  dragPosition: { x: number; y: number } | null
): GalaxyState {
  if (isPaused) {
    return state;
  }

  const newGalaxies = state.galaxies.map(galaxy => ({
    ...galaxy,
    stars: galaxy.stars.map(star => ({ ...star })),
    trail: [...galaxy.trail]
  }));

  let newSupernovas = state.supernovas.map(s => ({ ...s }));
  let newCollisionEvents = state.collisionEvents.map(e => ({ ...e }));
  let isColliding = state.isColliding;

  const totalStars = newGalaxies.reduce((sum, g) => sum + g.stars.length, 0);
  const trailLength = totalStars > 1000
    ? Math.max(TRAIL_LENGTH_MIN, TRAIL_LENGTH_BASE - Math.floor((totalStars - 1000) / 200))
    : TRAIL_LENGTH_BASE;

  if (draggedGalaxyId && dragPosition) {
    const galaxy = newGalaxies.find(g => g.id === draggedGalaxyId);
    if (galaxy) {
      const dx = dragPosition.x - galaxy.centerX;
      const dy = dragPosition.y - galaxy.centerY;
      galaxy.centerX = dragPosition.x;
      galaxy.centerY = dragPosition.y;
      galaxy.vx = dx * 0.1;
      galaxy.vy = dy * 0.1;

      galaxy.stars.forEach(star => {
        star.x += dx;
        star.y += dy;
      });
    }
  } else {
    for (let i = 0; i < newGalaxies.length; i++) {
      for (let j = i + 1; j < newGalaxies.length; j++) {
        applyGravityBetweenGalaxies(newGalaxies[i], newGalaxies[j]);
      }
    }

    newGalaxies.forEach(galaxy => {
      updateGalaxyCenter(galaxy);
      updateStarPositions(galaxy);
      updateTrail(galaxy, trailLength);
    });
  }

  const collisionResult = checkCollisions(newGalaxies, state.frameCount);
  if (collisionResult.supernovas.length > 0) {
    isColliding = true;
    newSupernovas = [...newSupernovas, ...collisionResult.supernovas];
    newCollisionEvents = [...newCollisionEvents, ...collisionResult.events];
  }

  newSupernovas = updateSupernovas(newSupernovas);
  newCollisionEvents = updateCollisionEvents(newCollisionEvents);

  const newTotalStarCount = newGalaxies.reduce((sum, g) => sum + g.stars.length, 0);

  const newHistory = [...state.history];
  if (state.frameCount % 10 === 0) {
    newGalaxies.forEach(galaxy => {
      newHistory.push({
        frame: state.frameCount,
        centerX: galaxy.centerX,
        centerY: galaxy.centerY,
        starCount: galaxy.stars.length
      });
    });
  }

  return {
    ...state,
    galaxies: newGalaxies,
    supernovas: newSupernovas,
    collisionEvents: newCollisionEvents,
    isColliding,
    totalStarCount: newTotalStarCount,
    frameCount: state.frameCount + 1,
    history: newHistory
  };
}

function applyGravityBetweenGalaxies(galaxy1: Galaxy, galaxy2: Galaxy): void {
  const dx = galaxy2.centerX - galaxy1.centerX;
  const dy = galaxy2.centerY - galaxy1.centerY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 10) return;

  const force = GRAVITY_CONSTANT / (dist * dist);
  const fx = (dx / dist) * force;
  const fy = (dy / dist) * force;

  const massRatio1 = galaxy2.stars.length / (galaxy1.stars.length + galaxy2.stars.length);
  const massRatio2 = galaxy1.stars.length / (galaxy1.stars.length + galaxy2.stars.length);

  galaxy1.stars.forEach(star => {
    star.vx += fx * massRatio1 * DT;
    star.vy += fy * massRatio1 * DT;
  });

  galaxy2.stars.forEach(star => {
    star.vx -= fx * massRatio2 * DT;
    star.vy -= fy * massRatio2 * DT;
  });
}

function updateStarPositions(galaxy: Galaxy): void {
  const { centerX, centerY } = galaxy;

  galaxy.stars.forEach(star => {
    const dx = star.x - centerX;
    const dy = star.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      const centripetalForce = 0.05 / (dist * 0.1 + 1);
      const fx = -dx / dist * centripetalForce;
      const fy = -dy / dist * centripetalForce;
      star.vx += fx * DT;
      star.vy += fy * DT;
    }

    star.x += star.vx * DT;
    star.y += star.vy * DT;
  });
}

function updateGalaxyCenter(galaxy: Galaxy): void {
  let totalMass = 0;
  let sumX = 0;
  let sumY = 0;
  let sumVx = 0;
  let sumVy = 0;

  galaxy.stars.forEach(star => {
    const mass = star.type === 'core' ? 3 : 1;
    totalMass += mass;
    sumX += star.x * mass;
    sumY += star.y * mass;
    sumVx += star.vx * mass;
    sumVy += star.vy * mass;
  });

  galaxy.centerX = sumX / totalMass;
  galaxy.centerY = sumY / totalMass;
  galaxy.vx = sumVx / totalMass;
  galaxy.vy = sumVy / totalMass;
}

function updateTrail(galaxy: Galaxy, maxLength: number): void {
  galaxy.trail.unshift({ x: galaxy.centerX, y: galaxy.centerY });
  if (galaxy.trail.length > maxLength) {
    galaxy.trail.pop();
  }
}

function checkCollisions(
  galaxies: Galaxy[],
  frameCount: number
): { supernovas: SupernovaParticle[]; events: CollisionEvent[] } {
  const supernovas: SupernovaParticle[] = [];
  const events: CollisionEvent[] = [];

  if (galaxies.length < 2) return { supernovas, events };

  const g1 = galaxies[0];
  const g2 = galaxies[1];

  let collisionCount = 0;
  let collisionX = 0;
  let collisionY = 0;

  for (let i = 0; i < g1.stars.length; i++) {
    const s1 = g1.stars[i];
    for (let j = 0; j < g2.stars.length; j++) {
      const s2 = g2.stars[j];
      const dx = s1.x - s2.x;
      const dy = s1.y - s2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < COLLISION_THRESHOLD) {
        collisionCount++;
        collisionX += (s1.x + s2.x) / 2;
        collisionY += (s1.y + s2.y) / 2;
      }
    }
  }

  if (collisionCount > 0 && frameCount % 10 === 0) {
    collisionX /= collisionCount;
    collisionY /= collisionCount;

    const count = Math.floor(
      Math.random() * (SUPERNOVA_COUNT_MAX - SUPERNOVA_COUNT_MIN) + SUPERNOVA_COUNT_MIN
    );

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * SUPERNOVA_SPEED + SUPERNOVA_SPEED * 0.5;
      const colorT = Math.random();
      const color = lerpColor('#FF6F00', '#FF3D00', colorT);

      supernovas.push({
        x: collisionX + (Math.random() - 0.5) * 20,
        y: collisionY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: SUPERNOVA_LIFETIME,
        maxLife: SUPERNOVA_LIFETIME,
        color,
        size: Math.random() * 3 + 2
      });
    }

    events.push({
      x: collisionX,
      y: collisionY,
      time: HALO_DURATION,
      haloOpacity: 0.6,
      haloDuration: HALO_DURATION
    });
  }

  return { supernovas, events };
}

function updateSupernovas(supernovas: SupernovaParticle[]): SupernovaParticle[] {
  return supernovas
    .map(s => ({
      ...s,
      x: s.x + s.vx,
      y: s.y + s.vy,
      life: s.life - 1,
      vx: s.vx * 0.98,
      vy: s.vy * 0.98
    }))
    .filter(s => s.life > 0);
}

function updateCollisionEvents(events: CollisionEvent[]): CollisionEvent[] {
  return events
    .map(e => ({
      ...e,
      time: e.time - 1,
      haloOpacity: (e.time / e.haloDuration) * 0.6
    }))
    .filter(e => e.time > 0);
}

function lerpColor(color1: string, color2: string, t: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function calculateFPS(frameCount: number, startTime: number): number {
  const elapsed = (performance.now() - startTime) / 1000;
  return elapsed > 0 ? Math.round(frameCount / elapsed) : 0;
}

export const PhysicsEngine = {
  updateGalaxies,
  calculateFPS
};

export default PhysicsEngine;
