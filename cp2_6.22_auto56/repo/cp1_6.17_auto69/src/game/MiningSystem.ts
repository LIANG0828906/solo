import type { Ship, Asteroid } from './types';

const MINING_RANGE = 30;
const MINING_RATE = 5;
const BEAM_HEIGHT = 40;
const BEAM_BLINK_PERIOD = 0.8;
const BEAM_ALPHA = 0.6;

export function checkMiningRange(ship: Ship, asteroid: Asteroid): boolean {
  const dx = ship.position.x - asteroid.position.x;
  const dy = ship.position.y - asteroid.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < asteroid.radius + MINING_RANGE;
}

export function calculateMiningEfficiency(
  ship: Ship,
  asteroid: Asteroid,
  deltaTime: number
): number {
  if (!checkMiningRange(ship, asteroid)) return 0;
  return MINING_RATE * deltaTime;
}

export function performMining(
  ship: Ship,
  asteroid: Asteroid,
  deltaTime: number,
  store: { ships: Ship[]; asteroids: Asteroid[] }
): number {
  const efficiency = calculateMiningEfficiency(ship, asteroid, deltaTime);
  if (efficiency <= 0) return 0;

  const mined = Math.min(efficiency, asteroid.minerals);
  if (mined <= 0) return 0;

  const shipIndex = store.ships.findIndex((s) => s.id === ship.id);
  if (shipIndex !== -1) {
    store.ships[shipIndex] = {
      ...store.ships[shipIndex],
      minerals: store.ships[shipIndex].minerals + mined,
    };
  }

  const asteroidIndex = store.asteroids.findIndex((a) => a.id === asteroid.id);
  if (asteroidIndex !== -1) {
    store.asteroids[asteroidIndex] = {
      ...store.asteroids[asteroidIndex],
      minerals: Math.max(0, store.asteroids[asteroidIndex].minerals - mined),
    };
  }

  return mined;
}

export function renderMiningBeam(
  ctx: CanvasRenderingContext2D,
  ship: Ship,
  asteroid: Asteroid,
  time: number
): void {
  if (!checkMiningRange(ship, asteroid)) return;

  const blinkPhase = (time % BEAM_BLINK_PERIOD) / BEAM_BLINK_PERIOD;
  const blinkAlpha = 0.5 + 0.5 * Math.sin(blinkPhase * Math.PI * 2);
  const alpha = BEAM_ALPHA * blinkAlpha;

  const startX = ship.position.x;
  const startY = ship.position.y;
  const endX = asteroid.position.x;
  const endY = asteroid.position.y;

  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;

  const nx = -dy / dist;
  const ny = dx / dist;

  const halfHeight = BEAM_HEIGHT / 2;

  ctx.save();
  ctx.globalAlpha = alpha;

  const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
  gradient.addColorStop(0, 'rgba(0, 191, 255, 0.9)');
  gradient.addColorStop(0.5, 'rgba(135, 206, 250, 1)');
  gradient.addColorStop(1, 'rgba(0, 191, 255, 0.7)');

  ctx.fillStyle = gradient;
  ctx.shadowColor = '#00BFFF';
  ctx.shadowBlur = 15;

  ctx.beginPath();
  ctx.moveTo(
    startX + nx * (halfHeight * 0.4),
    startY + ny * (halfHeight * 0.4)
  );
  ctx.lineTo(
    startX - nx * (halfHeight * 0.4),
    startY - ny * (halfHeight * 0.4)
  );
  ctx.lineTo(
    endX - nx * halfHeight,
    endY - ny * halfHeight
  );
  ctx.lineTo(
    endX + nx * halfHeight,
    endY + ny * halfHeight
  );
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#FFFFFF';
  ctx.globalAlpha = alpha * 0.6;
  ctx.lineWidth = 2;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.restore();
}
