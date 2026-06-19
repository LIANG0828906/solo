import { Debris, Ship, Warning } from './types';
import { gameStore } from '../store';
import { eventBus } from '../eventBus';

const WARNING_DISTANCE = 50;
const PREDICTION_TIME = 2;
const TOP_WARNING_COUNT = 3;
const SHIP_HIT_RADIUS = 12;

function getDirection(dx: number, dy: number): string {
  const angle = Math.atan2(dy, dx);
  const deg = (angle * 180) / Math.PI;
  if (deg >= -22.5 && deg < 22.5) return '东';
  if (deg >= 22.5 && deg < 67.5) return '东南';
  if (deg >= 67.5 && deg < 112.5) return '南';
  if (deg >= 112.5 && deg < 157.5) return '西南';
  if (deg >= 157.5 || deg < -157.5) return '西';
  if (deg >= -157.5 && deg < -112.5) return '西北';
  if (deg >= -112.5 && deg < -67.5) return '北';
  return '东北';
}

export function detectCollisionsAndWarnings(): void {
  const state = gameStore.getState();
  const { ship, debrisList } = state;

  if (state.gameStatus !== 'playing') return;

  const warnings: Warning[] = [];

  for (const debris of debrisList) {
    const dx = debris.x - ship.x;
    const dy = debris.y - ship.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (!ship.isInvincible && distance < SHIP_HIT_RADIUS + debris.radius) {
      handleCollision();
      continue;
    }

    const relVx = debris.vx;
    const relVy = debris.vy;

    let minDist = distance;
    let closestTime = 0;

    for (let t = 0.1; t <= PREDICTION_TIME; t += 0.1) {
      const futureX = debris.x + relVx * t;
      const futureY = debris.y + relVy * t;
      const futDx = futureX - ship.x;
      const futDy = futureY - ship.y;
      const futDist = Math.sqrt(futDx * futDx + futDy * futDy);

      if (futDist < minDist) {
        minDist = futDist;
        closestTime = t;
      }
    }

    if (minDist < WARNING_DISTANCE) {
      const direction = getDirection(dx, dy);
      warnings.push({
        debrisId: debris.id,
        distance: minDist,
        direction,
        timeToCollision: closestTime,
      });
    }
  }

  warnings.sort((a, b) => a.distance - b.distance);
  const topWarnings = warnings.slice(0, TOP_WARNING_COUNT);

  gameStore.updateWarnings(topWarnings);
  eventBus.emit('warning:update', topWarnings);
}

function handleCollision(): void {
  const state = gameStore.getState();
  if (state.ship.isInvincible) return;

  gameStore.loseLife();
  eventBus.emit('collision:hit');

  if (state.ship.lives <= 1) {
    eventBus.emit('game:over');
  }
}

export function getWarningDebrisIds(): Set<string> {
  const state = gameStore.getState();
  return new Set(state.warnings.map((w) => w.debrisId));
}
