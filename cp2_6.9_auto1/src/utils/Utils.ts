import Phaser from 'phaser';

export interface Debris {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  isHighRisk: boolean;
  points: number;
  isClearing: boolean;
  clearPhase: 'rotating' | 'shrinking' | null;
  clearTimer: number;
  scale: number;
  orbitGroup: string | null;
  polygonPoints: Phaser.Geom.Point[];
  color: number;
  alpha: number;
}

export interface OrbitGroup {
  id: string;
  centerX: number;
  centerY: number;
  radius: number;
  angle: number;
  speed: number;
  debrisIds: string[];
  ellipseRatio: number;
  cleared: boolean;
}

export interface StarParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  alphaPhase: number;
  alphaSpeed: number;
  minAlpha: number;
  maxAlpha: number;
}

export interface LaserBeam {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  timer: number;
  maxTime: number;
  targetDebrisId: string | null;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
  alpha: number;
}

export interface PowerUpAnimation {
  type: 'shield' | 'gravity' | 'slow';
  timer: number;
  maxTime: number;
  active: boolean;
}

export function generatePolygon(size: number, sides: number = 6): Phaser.Geom.Point[] {
  const points: Phaser.Geom.Point[] = [];
  const actualSides = Math.max(4, Math.floor(sides + (Math.random() - 0.5) * 4));
  for (let i = 0; i < actualSides; i++) {
    const angle = (i / actualSides) * Math.PI * 2;
    const variance = 0.65 + Math.random() * 0.7;
    const r = size * variance;
    points.push(new Phaser.Geom.Point(
      Math.cos(angle) * r,
      Math.sin(angle) * r
    ));
  }
  return points;
}

export function calculatePolygonArea(points: Phaser.Geom.Point[]): number {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

export function generateOrbitPositions(
  centerX: number,
  centerY: number,
  radius: number,
  count: number,
  ellipseRatio: number = 0.7,
  startAngle: number = 0
): Array<{ x: number; y: number; angle: number }> {
  const positions: Array<{ x: number; y: number; angle: number }> = [];
  for (let i = 0; i < count; i++) {
    const angle = startAngle + (i / count) * Math.PI * 2;
    positions.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius * ellipseRatio,
      angle: angle
    });
  }
  return positions;
}

export function getOrbitPosition(
  centerX: number,
  centerY: number,
  radius: number,
  angle: number,
  ellipseRatio: number = 0.7
): { x: number; y: number } {
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius * ellipseRatio
  };
}

export function checkOrbitGroupClear(
  group: OrbitGroup,
  debrisMap: Map<string, Debris>
): boolean {
  if (group.cleared) return false;
  return group.debrisIds.every(id => {
    const debris = debrisMap.get(id);
    return debris && (debris.isClearing || debris.scale <= 0);
  });
}

export function getDebrisColor(isHighRisk: boolean): number {
  if (isHighRisk) {
    return 0xff3333;
  }
  const grayValue = Math.floor(136 + Math.random() * 34);
  return (grayValue << 16) | (grayValue << 8) | grayValue;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateRating(clearRate: number, collisions: number): string {
  if (clearRate > 0.9 && collisions === 0) return 'S';
  if (clearRate > 0.8 && collisions < 2) return 'A';
  if (clearRate > 0.6 && collisions < 5) return 'B';
  return 'C';
}

export function getRatingColor(rating: string): number {
  switch (rating) {
    case 'S': return 0xffd700;
    case 'A': return 0x00ff00;
    case 'B': return 0x00e5ff;
    case 'C': return 0xff8800;
    default: return 0xffffff;
  }
}

export function getShieldColor(shield: number, maxShield: number): number {
  const ratio = shield / maxShield;
  if (ratio > 0.6) return 0x00ff00;
  if (ratio > 0.3) return 0xffff00;
  return 0xff0000;
}

export function hexToPhaserColor(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}
