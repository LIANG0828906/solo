import { v4 as uuidv4 } from 'uuid';
import type { Ship, Bullet, Particle, GameState } from './types';
import { ParticleEngine } from './ParticleEngine';

const BULLET_RADIUS = 4;
const BULLET_SPEED = 500;
const BULLET_LIFE = 2.5;
const BULLET_DAMAGE = 25;
const SHIELD_RADIUS = 60;
const SHIELD_COLOR = '#00D4FF';
const SHIELD_ALPHA = 0.7;
const SHIELD_MAX_HP = 40;
const SHIELD_DURATION = 3000;
const SHIELD_COOLDOWN = 10000;
const WEAPON_COOLDOWN = 1000;
const TRAIL_COUNT = 4;

export function createBullet(ship: Ship, store: GameState): Bullet {
  const vx = Math.cos(ship.rotation) * BULLET_SPEED;
  const vy = Math.sin(ship.rotation) * BULLET_SPEED;

  const startX = ship.position.x + Math.cos(ship.rotation) * 20;
  const startY = ship.position.y + Math.sin(ship.rotation) * 20;

  const trail: Particle[] = [];
  for (let i = 0; i < TRAIL_COUNT; i++) {
    const t = (i + 1) / (TRAIL_COUNT + 1);
    trail.push({
      id: uuidv4(),
      position: {
        x: startX - vx * t * 0.02,
        y: startY - vy * t * 0.02,
      },
      velocity: { x: 0, y: 0 },
      color: ship.color,
      size: 2 - i * 0.4,
      life: 0.15 - i * 0.03,
      maxLife: 0.15 - i * 0.03,
      type: 'bulletTrail',
    });
  }

  const bullet: Bullet = {
    id: uuidv4(),
    position: { x: startX, y: startY },
    velocity: { x: vx, y: vy },
    color: ship.color,
    ownerId: ship.id,
    damage: BULLET_DAMAGE,
    life: BULLET_LIFE,
    trail,
  };

  return bullet;
}

export function checkBulletShipCollision(bullet: Bullet, ship: Ship): boolean {
  if (bullet.ownerId === ship.id) return false;
  const dx = bullet.position.x - ship.position.x;
  const dy = bullet.position.y - ship.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < BULLET_RADIUS + 18;
}

export function checkBulletShieldCollision(bullet: Bullet, ship: Ship): boolean {
  if (bullet.ownerId === ship.id) return false;
  if (!ship.isShieldActive && !ship.shieldActive) return false;
  const dx = bullet.position.x - ship.position.x;
  const dy = bullet.position.y - ship.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < BULLET_RADIUS + SHIELD_RADIUS;
}

export function applyDamage(ship: Ship, damage: number, store: GameState): void {
  const shipIndex = store.ships.findIndex((s) => s.id === ship.id);
  if (shipIndex === -1) return;

  let remainingDamage = damage;

  const currentShip = store.ships[shipIndex];
  const shieldOn = currentShip.isShieldActive || currentShip.shieldActive;
  const shieldHpValue = Math.max(currentShip.shieldHealth, currentShip.shieldHp);

  if (shieldOn && shieldHpValue > 0) {
    const absorbed = Math.min(shieldHpValue, remainingDamage);
    currentShip.shieldHealth -= absorbed;
    currentShip.shieldHp -= absorbed;
    remainingDamage -= absorbed;

    if (currentShip.shieldHealth <= 0 || currentShip.shieldHp <= 0) {
      currentShip.isShieldActive = false;
      currentShip.shieldActive = false;
    }
  }

  if (remainingDamage > 0) {
    currentShip.health = Math.max(0, currentShip.health - remainingDamage);
  }
}

export function canFire(ship: Ship): boolean {
  return ship.weaponCooldown <= 0;
}

export function canActivateShield(ship: Ship): boolean {
  return ship.shieldCooldown <= 0 && !ship.isShieldActive && !ship.shieldActive;
}

export function updateCooldowns(ship: Ship, deltaTime: number, store: GameState): void {
  const shipIndex = store.ships.findIndex((s) => s.id === ship.id);
  if (shipIndex === -1) return;

  const deltaMs = deltaTime * 1000;
  const s = store.ships[shipIndex];

  s.weaponCooldown = Math.max(0, s.weaponCooldown - deltaMs);

  if (s.isShieldActive || s.shieldActive) {
    const prevCooldown = s.shieldCooldown;
    s.shieldCooldown = Math.max(0, s.shieldCooldown - deltaMs);
    const elapsed = prevCooldown - s.shieldCooldown;
    const shieldElapsed = SHIELD_DURATION - s.shieldCooldown;
    if (s.shieldHealth <= 0 || s.shieldHp <= 0) {
      s.isShieldActive = false;
      s.shieldActive = false;
      s.shieldCooldown = SHIELD_COOLDOWN;
    } else if (shieldElapsed >= SHIELD_DURATION) {
      s.isShieldActive = false;
      s.shieldActive = false;
    }
  } else {
    s.shieldCooldown = Math.max(0, s.shieldCooldown - deltaMs);
  }
}

export function renderBullet(ctx: CanvasRenderingContext2D, bullet: Bullet): void {
  const trail = bullet.trail;
  ParticleEngine.renderParticles(ctx, trail);

  ctx.save();
  ctx.fillStyle = bullet.color;
  ctx.shadowColor = bullet.color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(bullet.position.x, bullet.position.y, BULLET_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#FFFFFF';
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(bullet.position.x, bullet.position.y, BULLET_RADIUS * 0.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function renderShield(ctx: CanvasRenderingContext2D, ship: Ship, time: number): void {
  if (!ship.isShieldActive && !ship.shieldActive) return;

  const rotation = time * 1.5;
  const alphaMult = 0.8 + 0.2 * Math.sin(time * 4);

  ctx.save();
  ctx.translate(ship.position.x, ship.position.y);
  ctx.rotate(rotation);

  ctx.globalAlpha = SHIELD_ALPHA * alphaMult;
  ctx.strokeStyle = SHIELD_COLOR;
  ctx.lineWidth = 2;
  ctx.shadowColor = SHIELD_COLOR;
  ctx.shadowBlur = 15;

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6;
    const x = Math.cos(angle) * SHIELD_RADIUS;
    const y = Math.sin(angle) * SHIELD_RADIUS;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  ctx.rotate(-rotation * 0.5);
  ctx.globalAlpha = SHIELD_ALPHA * 0.5 * alphaMult;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6 + Math.PI / 6;
    const r = SHIELD_RADIUS * 0.9;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  for (let i = 0; i < 6; i++) {
    const angle1 = (Math.PI * 2 * i) / 6;
    const angle2 = (Math.PI * 2 * ((i + 3) % 6)) / 6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle1) * SHIELD_RADIUS * 0.9, Math.sin(angle1) * SHIELD_RADIUS * 0.9);
    ctx.lineTo(Math.cos(angle2) * SHIELD_RADIUS * 0.9, Math.sin(angle2) * SHIELD_RADIUS * 0.9);
    ctx.stroke();
  }

  const gradient = ctx.createRadialGradient(0, 0, SHIELD_RADIUS * 0.5, 0, 0, SHIELD_RADIUS);
  gradient.addColorStop(0, 'rgba(0, 212, 255, 0)');
  gradient.addColorStop(1, 'rgba(0, 212, 255, 0.15)');
  ctx.fillStyle = gradient;
  ctx.globalAlpha = alphaMult;
  ctx.beginPath();
  ctx.arc(0, 0, SHIELD_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
