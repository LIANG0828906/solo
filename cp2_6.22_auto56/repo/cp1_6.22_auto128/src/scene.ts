import type { Debris, GravityField, CollectFlash, GameState } from './types';
import { getCurrentLevel } from './levels';

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 700;
const GRAVITY_ACCELERATION = 5;
const GRAVITY_DURATION = 2000;
const RIPPLE_DURATION = 600;
const RIPPLE_MAX_RADIUS = 120;
const HATCH_RADIUS = 30;
const SHIP_X = 100;
const SHIP_Y = CANVAS_HEIGHT - 100;

let debrisIdCounter = 0;
let gravityFieldIdCounter = 0;

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

export function createDebris(count: number): Debris[] {
  const debris: Debris[] = [];
  for (let i = 0; i < count; i++) {
    const radius = 4 + Math.random() * 6;
    const speed = 0.5 + Math.random() * 1.5;
    const angle = Math.random() * Math.PI * 2;
    const colorT = Math.random();
    const hatchZoneLeft = SHIP_X - HATCH_RADIUS - 20;
    const hatchZoneRight = SHIP_X + HATCH_RADIUS + 20;
    const hatchZoneTop = SHIP_Y - HATCH_RADIUS - 20;
    const hatchZoneBottom = SHIP_Y + HATCH_RADIUS + 20;

    let x: number, y: number;
    do {
      x = radius + Math.random() * (CANVAS_WIDTH - radius * 2);
      y = radius + Math.random() * (CANVAS_HEIGHT - radius * 2);
    } while (x > hatchZoneLeft && x < hatchZoneRight && y > hatchZoneTop && y < hatchZoneBottom);

    debris.push({
      id: debrisIdCounter++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      color: lerpColor('#45A29E', '#66FCF1', colorT),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.05
    });
  }
  return debris;
}

export function createInitialGameState(level: number): GameState {
  const levelData = getCurrentLevel(level);
  return {
    currentLevel: level,
    score: 0,
    scoreAnimation: { targetScore: 0, scale: 1.0, animating: false, startAt: 0 },
    debris: createDebris(levelData.debrisCount),
    gravityFields: [],
    collectFlashes: [],
    levelComplete: false,
    levelCompleteAt: 0,
    shipX: SHIP_X,
    shipY: SHIP_Y,
    hatchRadius: HATCH_RADIUS
  };
}

export function addGravityField(state: GameState, x: number, y: number, now: number): void {
  state.gravityFields.push({
    id: gravityFieldIdCounter++,
    x,
    y,
    createdAt: now,
    duration: GRAVITY_DURATION,
    rippleRadius: 0,
    rippleDuration: RIPPLE_DURATION,
    active: true,
    fadeStart: now + GRAVITY_DURATION - 300
  });
}

export function addCollectFlash(state: GameState, x: number, y: number, now: number): void {
  state.collectFlashes.push({
    x,
    y,
    createdAt: now,
    duration: 300
  });
}

function increaseScore(state: GameState, now: number): void {
  state.score += 1;
  state.scoreAnimation = {
    targetScore: state.score,
    scale: 1.1,
    animating: true,
    startAt: now
  };
}

export function updateScene(state: GameState, deltaTime: number, now: number): void {
  const dt = deltaTime / 16.67;

  for (const field of state.gravityFields) {
    const elapsed = now - field.createdAt;
    if (elapsed < field.rippleDuration) {
      field.rippleRadius = (elapsed / field.rippleDuration) * RIPPLE_MAX_RADIUS;
    }
    if (elapsed >= field.duration) {
      field.active = false;
    }
  }
  state.gravityFields = state.gravityFields.filter(
    (f) => now - f.createdAt < f.duration + 300
  );

  state.collectFlashes = state.collectFlashes.filter(
    (f) => now - f.createdAt < f.duration
  );

  if (state.scoreAnimation.animating) {
    const elapsed = now - state.scoreAnimation.startAt;
    if (elapsed >= 150) {
      state.scoreAnimation.animating = false;
      state.scoreAnimation.scale = 1.0;
    } else {
      const t = elapsed / 150;
      state.scoreAnimation.scale = 1.1 - t * 0.1;
    }
  }

  for (const debris of state.debris) {
    for (const field of state.gravityFields) {
      if (!field.active) continue;
      const dx = field.x - debris.x;
      const dy = field.y - debris.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < RIPPLE_MAX_RADIUS && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        debris.vx += nx * GRAVITY_ACCELERATION * dt;
        debris.vy += ny * GRAVITY_ACCELERATION * dt;
      }
    }

    debris.x += debris.vx * dt;
    debris.y += debris.vy * dt;
    debris.rotation += debris.rotationSpeed * dt;

    if (debris.x - debris.radius < 0) {
      debris.x = debris.radius;
      debris.vx = Math.abs(debris.vx) * 0.8;
    }
    if (debris.x + debris.radius > CANVAS_WIDTH) {
      debris.x = CANVAS_WIDTH - debris.radius;
      debris.vx = -Math.abs(debris.vx) * 0.8;
    }
    if (debris.y - debris.radius < 0) {
      debris.y = debris.radius;
      debris.vy = Math.abs(debris.vy) * 0.8;
    }
    if (debris.y + debris.radius > CANVAS_HEIGHT) {
      debris.y = CANVAS_HEIGHT - debris.radius;
      debris.vy = -Math.abs(debris.vy) * 0.8;
    }

    const speed = Math.sqrt(debris.vx * debris.vx + debris.vy * debris.vy);
    const maxSpeed = 8;
    if (speed > maxSpeed) {
      debris.vx = (debris.vx / speed) * maxSpeed;
      debris.vy = (debris.vy / speed) * maxSpeed;
    }
  }

  const collected: number[] = [];
  for (const debris of state.debris) {
    const dx = state.shipX - debris.x;
    const dy = state.shipY - debris.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < state.hatchRadius + debris.radius) {
      collected.push(debris.id);
      addCollectFlash(state, debris.x, debris.y, now);
    }
  }

  if (collected.length > 0) {
    state.debris = state.debris.filter((d) => !collected.includes(d.id));
    for (let i = 0; i < collected.length; i++) {
      increaseScore(state, now + i * 20);
    }
  }
}
