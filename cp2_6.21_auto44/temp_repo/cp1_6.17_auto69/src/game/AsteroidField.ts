import { v4 as uuidv4 } from 'uuid';
import type { Vector2, Asteroid } from './types';

const COLORS = ['#8B8B8B', '#7A6B5A', '#6B5D4F', '#5C4F42', '#4A3728'];
const MIN_ASTEROID_RADIUS = 20;

function generateVertices(radius: number): Vector2[] {
  const vertices: Vector2[] = [];
  const numVertices = 8 + Math.floor(Math.random() * 5);
  for (let i = 0; i < numVertices; i++) {
    const angle = (Math.PI * 2 * i) / numVertices;
    const variance = 0.7 + Math.random() * 0.5;
    const r = radius * variance;
    vertices.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    });
  }
  return vertices;
}

function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function isOverlapping(
  position: Vector2,
  radius: number,
  asteroids: Asteroid[]
): boolean {
  for (const a of asteroids) {
    const dx = position.x - a.position.x;
    const dy = position.y - a.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < radius + a.radius + 20) {
      return true;
    }
  }
  return false;
}

function isNearSpawn(position: Vector2, canvasWidth: number, canvasHeight: number): boolean {
  const spawnX = canvasWidth / 2;
  const spawnY = canvasHeight / 2;
  const dx = position.x - spawnX;
  const dy = position.y - spawnY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < 150;
}

export function generateAsteroids(
  count: number,
  canvasWidth: number,
  canvasHeight: number
): Asteroid[] {
  const asteroids: Asteroid[] = [];
  const targetCount = Math.max(60, Math.min(80, count));
  let attempts = 0;
  const maxAttempts = targetCount * 50;

  while (asteroids.length < targetCount && attempts < maxAttempts) {
    attempts++;
    const radius = 20 + Math.random() * 60;
    const position = {
      x: 50 + Math.random() * (canvasWidth - 100),
      y: 50 + Math.random() * (canvasHeight - 100),
    };

    if (isNearSpawn(position, canvasWidth, canvasHeight)) continue;
    if (isOverlapping(position, radius, asteroids)) continue;

    const minerals = 5 + Math.floor(radius * 2);
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 15;
    asteroids.push({
      id: uuidv4(),
      position,
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      radius,
      size: radius,
      color: randomColor(),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (0.01 + Math.random() * 0.04) * (Math.random() < 0.5 ? 1 : -1),
      minerals,
      maxMinerals: minerals,
      fragments: Math.floor(radius / 10),
      vertices: generateVertices(radius),
    });
  }

  return asteroids;
}

export function splitAsteroid(asteroid: Asteroid): Asteroid[] {
  const newRadius = asteroid.radius / Math.SQRT2;
  if (newRadius < MIN_ASTEROID_RADIUS) return [];

  const fragments: Asteroid[] = [];
  const numFragments = 2 + Math.floor(Math.random() * 3);
  const newMinerals = Math.floor(asteroid.minerals / numFragments);

  for (let i = 0; i < numFragments; i++) {
    const angle = (Math.PI * 2 * i) / numFragments + Math.random() * 0.5;
    const speed = 30 + Math.random() * 40;
    const baseVel = asteroid.velocity || { x: 0, y: 0 };
    const fragRadius = newRadius * (0.75 + Math.random() * 0.5);

    fragments.push({
      id: uuidv4(),
      position: {
        x: asteroid.position.x,
        y: asteroid.position.y,
      },
      velocity: {
        x: baseVel.x + Math.cos(angle) * speed,
        y: baseVel.y + Math.sin(angle) * speed,
      },
      radius: fragRadius,
      size: fragRadius,
      color: asteroid.color,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (0.02 + Math.random() * 0.04) * (Math.random() < 0.5 ? 1 : -1),
      minerals: newMinerals,
      maxMinerals: newMinerals,
      fragments: Math.max(2, Math.floor(fragRadius / 10)),
      vertices: generateVertices(fragRadius),
    });
  }

  return fragments;
}

export function renderAsteroid(
  ctx: CanvasRenderingContext2D,
  asteroid: Asteroid
): void {
  const radius = asteroid.radius;

  ctx.save();
  ctx.translate(asteroid.position.x, asteroid.position.y);
  ctx.rotate(asteroid.rotation);

  const gradient = ctx.createRadialGradient(
    -radius * 0.3,
    -radius * 0.3,
    0,
    0,
    0,
    radius
  );
  gradient.addColorStop(0, lightenColor(asteroid.color, 30));
  gradient.addColorStop(0.7, asteroid.color);
  gradient.addColorStop(1, darkenColor(asteroid.color, 30));

  ctx.beginPath();
  const verts = asteroid.vertices;
  ctx.moveTo(verts[0].x, verts[0].y);
  for (let i = 1; i < verts.length; i++) {
    ctx.lineTo(verts[i].x, verts[i].y);
  }
  ctx.closePath();

  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = darkenColor(asteroid.color, 50);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const numCraters = Math.floor(radius / 30);
  for (let i = 0; i < numCraters; i++) {
    const craterAngle = (Math.PI * 2 * i) / numCraters + (i % 2) * 0.7;
    const craterDist = radius * (0.2 + (i % 3) * 0.15);
    const craterX = Math.cos(craterAngle) * craterDist;
    const craterY = Math.sin(craterAngle) * craterDist;
    const craterSize = radius * (0.08 + (i % 2) * 0.04);

    ctx.beginPath();
    ctx.arc(craterX, craterY, craterSize, 0, Math.PI * 2);
    ctx.fillStyle = darkenColor(asteroid.color, 20);
    ctx.fill();
  }

  if (asteroid.minerals > 0 && asteroid.maxMinerals > 0) {
    const mineralPct = asteroid.minerals / asteroid.maxMinerals;
    ctx.globalAlpha = 0.3 * mineralPct;
    ctx.fillStyle = '#00BFFF';
    ctx.beginPath();
    ctx.arc(-radius * 0.2, -radius * 0.2, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 0.3, radius * 0.1, radius * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
}
