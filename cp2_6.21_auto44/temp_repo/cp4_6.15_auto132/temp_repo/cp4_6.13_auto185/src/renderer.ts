import {
  Room,
  CELL_SIZE,
  GRID_COLS,
  GRID_ROWS,
  Point,
  START_ROOM_X,
  START_ROOM_Y
} from './map';
import { Tower, TowerType, TOWER_CONFIGS, TOWER_ORDER, getTowerCenter, getUpgradePrice } from './tower';
import { Monster } from './monster';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  colorStart: string;
  colorEnd: string;
  size: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Layout {
  mapX: number;
  mapY: number;
  mapWidth: number;
  mapHeight: number;
  panelX: number;
  panelY: number;
  panelWidth: number;
  panelHeight: number;
  scale: number;
  isMobile: boolean;
  towerBarX: number;
  towerBarY: number;
  towerBarWidth: number;
  towerBarHeight: number;
}

export const MAX_PARTICLES = 200;

export function lerpColor(c1: string, c2: string, t: number): string {
  const h1 = c1.replace('#', '');
  const h2 = c2.replace('#', '');
  const r1 = parseInt(h1.substring(0, 2), 16);
  const g1 = parseInt(h1.substring(2, 4), 16);
  const b1 = parseInt(h1.substring(4, 6), 16);
  const r2 = parseInt(h2.substring(0, 2), 16);
  const g2 = parseInt(h2.substring(2, 4), 16);
  const b2 = parseInt(h2.substring(4, 6), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

export function createLayout(viewportW: number, viewportH: number): Layout {
  const isMobile = viewportW < 800;
  const mapPixelW = GRID_COLS * CELL_SIZE;
  const mapPixelH = GRID_ROWS * CELL_SIZE;

  if (isMobile) {
    const mapAreaH = viewportH - 60;
    const scale = Math.min(viewportW / mapPixelW, mapAreaH / mapPixelH, 1.5);
    const mapW = mapPixelW * scale;
    const mapH = mapPixelH * scale;
    return {
      mapX: (viewportW - mapW) / 2,
      mapY: (mapAreaH - mapH) / 2,
      mapWidth: mapW,
      mapHeight: mapH,
      panelX: 0,
      panelY: viewportH - 60,
      panelWidth: viewportW,
      panelHeight: 60,
      scale,
      isMobile,
      towerBarX: 0,
      towerBarY: 0,
      towerBarWidth: 0,
      towerBarHeight: 0
    };
  }

  const targetMapW = viewportW * 0.7;
  const scale = Math.min(targetMapW / mapPixelW, viewportH / mapPixelH, 1.5);
  const mapW = mapPixelW * scale;
  const mapH = mapPixelH * scale;
  const mapX = (viewportW - mapW - (viewportW * 0.25)) / 2 + 0;
  const panelW = viewportW * 0.25;

  return {
    mapX: (viewportW - panelW - mapW) / 2,
    mapY: (viewportH - mapH) / 2,
    mapWidth: mapW,
    mapHeight: mapH,
    panelX: viewportW - panelW - 10,
    panelY: 10,
    panelWidth: panelW,
    panelHeight: viewportH - 20,
    scale,
    isMobile,
    towerBarX: 10,
    towerBarY: viewportH - 80,
    towerBarWidth: viewportW * 0.5,
    towerBarHeight: 70
  };
}

export function canvasToMapCoord(
  cx: number,
  cy: number,
  layout: Layout
): { gridX: number; gridY: number; inMap: boolean } {
  const localX = (cx - layout.mapX) / layout.scale;
  const localY = (cy - layout.mapY) / layout.scale;
  const gridX = Math.floor(localX / CELL_SIZE);
  const gridY = Math.floor(localY / CELL_SIZE);
  const inMap =
    localX >= 0 &&
    localX < GRID_COLS * CELL_SIZE &&
    localY >= 0 &&
    localY < GRID_ROWS * CELL_SIZE;
  return { gridX, gridY, inMap };
}

export function screenParticleBurst(
  particles: Particle[],
  x: number,
  y: number,
  count: number,
  colorStart: string,
  colorEnd: string,
  speed: number,
  life: number
): void {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const spd = speed * (0.5 + Math.random() * 0.5);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life,
      maxLife: life,
      colorStart,
      colorEnd,
      size: 2 + Math.random() * 3
    });
  }
  while (particles.length > MAX_PARTICLES) {
    particles.shift();
  }
}

export function updateParticles(particles: Particle[], dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

export function updateFloatingTexts(texts: FloatingText[], dt: number): void {
  for (let i = texts.length - 1; i >= 0; i--) {
    const t = texts[i];
    t.y -= 30 * dt;
    t.life -= dt;
    if (t.life <= 0) texts.splice(i, 1);
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.3);
  ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
  ctx.bezierCurveTo(x - size * 0.5, y + size * 0.55, x, y + size * 0.75, x, y + size);
  ctx.bezierCurveTo(x, y + size * 0.75, x + size * 0.5, y + size * 0.55, x + size * 0.5, y + size * 0.3);
  ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3);
  ctx.closePath();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerR: number,
  innerR: number
): void {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
}

function drawPentagon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
): void {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  layout: Layout;
  room: Room;
  towers: Tower[];
  monsters: Monster[];
  particles: Particle[];
  floatingTexts: