export interface Vec2 {
  x: number;
  y: number;
}

export interface Player {
  position: Vec2;
  angle: number;
  health: number;
  maxHealth: number;
  speed: number;
  invincibleTimer: number;
}

export interface Bullet {
  position: Vec2;
  velocity: Vec2;
  active: boolean;
  trail: Vec2[];
  radius: number;
}

export type BarrageType = "circular" | "fan" | "spiral";

export interface BarrageBullet {
  position: Vec2;
  velocity: Vec2;
  active: boolean;
  type: BarrageType;
  color: string;
  angle: number;
  radius: number;
  tracking: boolean;
  trackingAccuracy: number;
  age: number;
  amplitude: number;
  frequency: number;
  baseAngle: number;
  baseSpeed: number;
}

export interface Particle {
  position: Vec2;
  velocity: Vec2;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  active: boolean;
}

export interface SpecialAbility {
  active: boolean;
  radius: number;
  maxRadius: number;
  duration: number;
  elapsed: number;
  cooldown: number;
  cooldownTimer: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export interface HUDData {
  health: number;
  maxHealth: number;
  combo: number;
  score: number;
  comboFlash: boolean;
  specialCooldown: number;
  specialMaxCooldown: number;
  specialReady: boolean;
}

export type GameState = "start" | "playing" | "gameover";

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PLAYER_SPEED = 250;
export const PLAYER_SIZE = 20;
export const PLAYER_COLOR = "#3B82F6";

export const BULLET_SPEED = 500;
export const BULLET_FIRE_RATE = 5;
export const BULLET_RADIUS = 2;
export const BULLET_COLOR = "#F59E0B";
export const BULLET_TRAIL_LENGTH = 5;

export const BARRAGE_CIRCULAR_COLOR = "#A78BFA";
export const BARRAGE_FAN_COLOR = "#34D399";
export const BARRAGE_SPIRAL_COLOR = "#FB923C";

export const SPECIAL_COLOR = "#EF4444";
export const SPECIAL_MAX_RADIUS = 400;
export const SPECIAL_DURATION = 0.5;
export const SPECIAL_COOLDOWN = 8;

export const PARTICLE_MAX_COUNT = 200;

export const COMBO_FLASH_THRESHOLD = 10;
export const COMBO_FLASH_DURATION = 0.3;

export const COLLISION_BULLET_BARRAGE_RADIUS = 6;
export const COLLISION_PLAYER_RADIUS = 10;

export const MAX_HEALTH = 3;

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function vec2Add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function vec2Sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function vec2Scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function vec2Length(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function vec2Normalize(v: Vec2): Vec2 {
  const len = vec2Length(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function vec2Distance(a: Vec2, b: Vec2): number {
  return vec2Length(vec2Sub(a, b));
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}
