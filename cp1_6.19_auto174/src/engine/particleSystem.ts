import { Debris, SatellitePart, Particle, Star, Ship } from './types';
import { gameStore } from '../store';
import { eventBus } from '../eventBus';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const INITIAL_DEBRIS_MIN = 50;
const INITIAL_DEBRIS_MAX = 80;
const SATELLITE_PARTS_COUNT = 12;
const STAR_COUNT_MIN = 60;
const STAR_COUNT_MAX = 80;
const MAX_DEBRIS = 120;
const BEAM_DURATION = 0.5;
const BEAM_COOLDOWN = 1.0;
const BEAM_LENGTH = 60;
const PART_COLLECT_DISTANCE = 20;

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomColor(min: number, max: number): string {
  const v = Math.floor(randomRange(min, max));
  return `rgb(${v}, ${v}, ${v})`;
}

function createDebris(canvasWidth: number, canvasHeight: number, speedMultiplier: number = 1): Debris {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const maxAxis = Math.max(canvasWidth, canvasHeight) * 0.6;

  const orbitA = randomRange(maxAxis * 0.2, maxAxis * 0.5);
  const orbitB = orbitA * randomRange(0.6, 0.9);
  const orbitAngle = randomRange(0, Math.PI * 2);
  const orbitSpeed = randomRange(10, 30) * speedMultiplier / Math.max(orbitA, orbitB);

  const x = centerX + Math.cos(orbitAngle) * orbitA;
  const y = centerY + Math.sin(orbitAngle) * orbitB;

  const vertices = Math.floor(randomRange(2, 6));
  const radius = randomRange(2, 8);
  const rotation = randomRange(0, Math.PI * 2);
  const rotationSpeed = Math.random() > 0.5 ? randomRange(1, 5) * (Math.PI / 180) : 0;
  const color = randomColor(85, 153);

  const angle = Math.atan2(
    -Math.sin(orbitAngle) * orbitB * orbitSpeed,
    -Math.sin(orbitAngle) * orbitA * orbitSpeed
  );
  const speed = randomRange(10, 30) * speedMultiplier;

  return {
    id: generateId(),
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius,
    vertices,
    rotation,
    rotationSpeed,
    color,
    orbitCenterX: centerX,
    orbitCenterY: centerY,
    orbitA,
    orbitB,
    orbitAngle,
    orbitSpeed: orbitSpeed * speedMultiplier,
  };
}

function createSatellitePart(canvasWidth: number, canvasHeight: number): SatellitePart {
  const margin = 80;
  return {
    id: generateId(),
    x: randomRange(margin, canvasWidth - margin),
    y: randomRange(margin, canvasHeight - margin),
    collected: false,
    glowPhase: randomRange(0, Math.PI * 2),
  };
}

function createStar(canvasWidth: number, canvasHeight: number): Star {
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    size: randomRange(1, 2),
    brightness: randomRange(0.3, 1),
  };
}

export function createVictoryParticles(x: number, y: number): Particle[] {
  const particles: Particle[] = [];
  const count = Math.floor(randomRange(10, 16));
  for (let i = 0; i < count; i++) {
    const angle = randomRange(0, Math.PI * 2);
    const speed = randomRange(30, 80);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.5,
      maxLife: 1.5,
      color: '#FFD700',
      size: randomRange(2, 4),
    });
  }
  return particles;
}

export function initGame(): void {
  const state = gameStore.getState();
  const { canvasWidth, canvasHeight } = state;

  const debrisCount = Math.floor(randomRange(INITIAL_DEBRIS_MIN, INITIAL_DEBRIS_MAX + 1));
  const debrisList: Debris[] = [];
  for (let i = 0; i < debrisCount; i++) {
    debrisList.push(createDebris(canvasWidth, canvasHeight));
  }

  const satelliteParts: SatellitePart[] = [];
  for (let i = 0; i < SATELLITE_PARTS_COUNT; i++) {
    satelliteParts.push(createSatellitePart(canvasWidth, canvasHeight));
  }

  const starCount = Math.floor(randomRange(STAR_COUNT_MIN, STAR_COUNT_MAX + 1));
  const stars: Star[] = [];
  for (let i = 0; i < starCount; i++) {
    stars.push(createStar(canvasWidth, canvasHeight));
  }

  gameStore.setState({
    debrisList,
    satelliteParts,
    stars,
    ship: {
      ...state.ship,
      x: canvasWidth / 2,
      y: canvasHeight / 2,
    },
  });

  eventBus.emit('game:init');
}

function addDebris(count: number): void {
  const state = gameStore.getState();
  const { canvasWidth, canvasHeight, difficultyMultiplier, debrisList } = state;
  const newDebris: Debris[] = [];
  const maxAdd = Math.min(count, MAX_DEBRIS - debrisList.length);
  for (let i = 0; i < maxAdd; i++) {
    newDebris.push(createDebris(canvasWidth, canvasHeight, difficultyMultiplier));
  }
  gameStore.setState({
    debrisList: [...debrisList, ...newDebris],
  });
}

function updateShip(dt: number, keys: Set<string>): Ship {
  const state = gameStore.getState();
  const ship = { ...state.ship };
  const { canvasWidth, canvasHeight } = state;

  if (!ship.isInvincible || ship.hitFlashTimer <= 0) {
    let dx = 0;
    let dy = 0;
    if (keys.has('w') || keys.has('arrowup')) dy -= 1;
    if (keys.has('s') || keys.has('arrowdown')) dy += 1;
    if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
    if (keys.has('d') || keys.has('arrowright')) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
      ship.angle = Math.atan2(dy, dx);
    }

    ship.x += dx * ship.speed * dt;
    ship.y += dy * ship.speed * dt;
  }

  const shipRadius = 15;
  ship.x = Math.max(shipRadius, Math.min(canvasWidth - shipRadius, ship.x));
  ship.y = Math.max(shipRadius, Math.min(canvasHeight - shipRadius, ship.y));

  if (ship.invincibleTimer > 0) {
    ship.invincibleTimer -= dt;
    if (ship.invincibleTimer <= 0) {
      ship.isInvincible = false;
    }
  }

  if (ship.hitFlashTimer > 0) {
    ship.hitFlashTimer -= dt;
  }

  if (ship.shieldCooldown > 0) {
    ship.shieldCooldown -= dt;
    if (ship.shieldCooldown < 0) ship.shieldCooldown = 0;
  }

  return ship;
}

function updateDebris(dt: number, debrisList: Debris[], multiplier: number): Debris[] {
  return debrisList.map((debris) => {
    const newDebris = { ...debris };
    newDebris.orbitAngle += newDebris.orbitSpeed * dt * multiplier;

    newDebris.x = newDebris.orbitCenterX + Math.cos(newDebris.orbitAngle) * newDebris.orbitA;
    newDebris.y = newDebris.orbitCenterY + Math.sin(newDebris.orbitAngle) * newDebris.orbitB;

    const speed = 15 * multiplier;
    const tanAngle = newDebris.orbitAngle + Math.PI / 2;
    const dx = Math.cos(tanAngle);
    const dy = Math.sin(tanAngle) * (newDebris.orbitB / newDebris.orbitA);
    const len = Math.sqrt(dx * dx + dy * dy);
    newDebris.vx = (dx / len) * speed;
    newDebris.vy = (dy / len) * speed;

    newDebris.rotation += newDebris.rotationSpeed * dt * 60;

    return newDebris;
  });
}

function updateSatelliteParts(dt: number, parts: SatellitePart[]): SatellitePart[] {
  return parts.map((part) => ({
    ...part,
    glowPhase: part.glowPhase + dt * (Math.PI * 2 / 1.2),
  }));
}

function updateParticles(dt: number, particles: Particle[]): Particle[] {
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      life: p.life - dt,
    }))
    .filter((p) => p.life > 0);
}

function updateBeam(dt: number, ship: Ship, mousePos: { x: number; y: number }): {
  beamActive: boolean;
  beamTimer: number;
  beamCooldown: number;
  beamAngle: number;
} {
  const state = gameStore.getState();
  let { beamActive, beamTimer, beamCooldown, beamAngle } = state;

  if (beamActive) {
    beamTimer -= dt;
    if (beamTimer <= 0) {
      beamActive = false;
      beamTimer = 0;
    }
  }

  if (beamCooldown > 0) {
    beamCooldown -= dt;
    if (beamCooldown < 0) beamCooldown = 0;
  }

  const dx = mousePos.x - ship.x;
  const dy = mousePos.y - ship.y;
  beamAngle = Math.atan2(dy, dx);

  return { beamActive, beamTimer, beamCooldown, beamAngle };
}

export function fireBeam(): void {
  const state = gameStore.getState();
  if (state.beamCooldown <= 0 && state.gameStatus === 'playing') {
    gameStore.setState({
      beamActive: true,
      beamTimer: BEAM_DURATION,
      beamCooldown: BEAM_COOLDOWN,
    });
    eventBus.emit('beam:fire');
  }
}

function checkPartCollection(ship: Ship, parts: SatellitePart[], beamActive: boolean, beamAngle: number): SatellitePart[] {
  if (!beamActive) return parts;

  let collected = false;
  const updatedParts = parts.map((part) => {
    if (part.collected) return part;

    const dx = part.x - ship.x;
    const dy = part.y - ship.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= PART_COLLECT_DISTANCE + BEAM_LENGTH * 0.5) {
      const partAngle = Math.atan2(dy, dx);
      let angleDiff = Math.abs(partAngle - beamAngle);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

      if (angleDiff < Math.PI / 4 && distance < BEAM_LENGTH + 20) {
        collected = true;
        const particles = createVictoryParticles(part.x, part.y);
        gameStore.addParticles(particles);
        gameStore.addScore(5);
        gameStore.incrementPartsCollected();
        eventBus.emit('part:collect', part.id);
        return { ...part, collected: true };
      }
    }
    return part;
  });

  const partsCollected = gameStore.getState().partsCollected;
  if (collected && (partsCollected + 1) % 3 === 0) {
    const newMultiplier = Math.min(gameStore.getState().difficultyMultiplier * 1.1, 2);
    gameStore.setDifficultyMultiplier(newMultiplier);
    addDebris(5);
    eventBus.emit('difficulty:increase', newMultiplier);
  }

  return updatedParts;
}

export function update(dt: number): void {
  const state = gameStore.getState();
  if (state.gameStatus !== 'playing') return;

  const keys = gameStore.getKeys();
  const mousePos = gameStore.getMousePosition();

  const ship = updateShip(dt, keys);
  const debrisList = updateDebris(dt, state.debrisList, state.difficultyMultiplier);
  const satelliteParts = updateSatelliteParts(dt, state.satelliteParts);
  const particles = updateParticles(dt, state.particles);
  const beamState = updateBeam(dt, ship, mousePos);

  const updatedParts = checkPartCollection(
    ship,
    satelliteParts,
    beamState.beamActive,
    beamState.beamAngle
  );

  const newGalaxyAngle = state.galaxyAngle + dt * (Math.PI / 180) * 0.2;

  gameStore.setState({
    ship,
    debrisList,
    satelliteParts: updatedParts,
    particles,
    ...beamState,
    galaxyAngle: newGalaxyAngle,
  });
}
