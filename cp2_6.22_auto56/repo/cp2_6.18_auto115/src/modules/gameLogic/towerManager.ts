import { v4 as uuidv4 } from 'uuid';
import type { Tower, Bullet, Meteor, Particle } from '../../types/game';
import { useGameStore } from './gameState';
import { createHitParticles } from './meteorManager';
import {
  TOWER_COST,
  TOWER_RANGE,
  TOWER_FIRE_INTERVAL_L1,
  TOWER_DAMAGE_L1,
  BULLET_RADIUS,
  BULLET_SPEED,
  GRID_SIZE,
  CORE_X,
  CORE_Y,
  CORE_MIN_DIST,
  CORE_RADIUS,
  MAP_WIDTH,
  MAP_HEIGHT,
  getGridCount,
  gridToWorld,
  dist,
  distSq,
  clamp,
} from '../../utils/math';

export const canBuildAt = (gridX: number, gridY: number): boolean => {
  const { cols, rows } = getGridCount();
  if (gridX < 0 || gridX >= cols || gridY < 0 || gridY >= rows) return false;

  const { x, y } = gridToWorld(gridX, gridY);
  if (dist(x, y, CORE_X, CORE_Y) < CORE_MIN_DIST + CORE_RADIUS) return false;

  const state = useGameStore.getState();
  for (const tower of state.towers) {
    if (tower.gridX === gridX && tower.gridY === gridY) return false;
  }

  return true;
};

export const createTower = (gridX: number, gridY: number): Tower => {
  const { x, y } = gridToWorld(gridX, gridY);
  return {
    id: uuidv4(),
    gridX,
    gridY,
    x,
    y,
    level: 1,
    range: TOWER_RANGE,
    fireInterval: TOWER_FIRE_INTERVAL_L1,
    lastFireTime: 0,
    damage: TOWER_DAMAGE_L1,
    bulletSpeed: BULLET_SPEED,
    color: '#FFFFFF',
    bulletColor: '#FFFFFF',
  };
};

export const buildTowerAt = (gridX: number, gridY: number): boolean => {
  const state = useGameStore.getState();
  if (!canBuildAt(gridX, gridY)) return false;
  if (state.resources < TOWER_COST) return false;

  const success = state.deductResources(TOWER_COST);
  if (!success) return false;

  const tower = createTower(gridX, gridY);
  state.addTower(tower);
  state.setBuildBubble(null);
  state.setBuildMode(false);
  return true;
};

export const findNearestMeteorInRange = (
  towerX: number,
  towerY: number,
  range: number,
  meteors: Meteor[]
): Meteor | null => {
  let nearest: Meteor | null = null;
  let minDistSq = range * range;
  for (const m of meteors) {
    if (!m.isMoving) continue;
    const dSq = distSq(towerX, towerY, m.x, m.y);
    if (dSq < minDistSq) {
      minDistSq = dSq;
      nearest = m;
    }
  }
  return nearest;
};

export const createBullet = (tower: Tower, target: Meteor): Bullet => {
  const dx = target.x - tower.x;
  const dy = target.y - tower.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / len;
  const ny = dy / len;

  return {
    id: uuidv4(),
    x: tower.x,
    y: tower.y,
    targetMeteorId: target.id,
    speed: tower.bulletSpeed,
    damage: tower.damage,
    radius: BULLET_RADIUS,
    color: tower.bulletColor,
    vx: nx * tower.bulletSpeed,
    vy: ny * tower.bulletSpeed,
  };
};

export const updateTowersFire = (now: number): void => {
  const state = useGameStore.getState();
  if (state.meteors.length === 0) return;

  const newBullets: Bullet[] = [];
  const updatedTowers = state.towers.map((tower) => {
    if (now - tower.lastFireTime < tower.fireInterval) return tower;
    const target = findNearestMeteorInRange(tower.x, tower.y, tower.range, state.meteors);
    if (!target) return tower;
    newBullets.push(createBullet(tower, target));
    return { ...tower, lastFireTime: now };
  });

  if (newBullets.length > 0) {
    for (const b of newBullets) {
      state.addBullet(b);
    }
  }
  useGameStore.setState({ towers: updatedTowers });
};

export const updateBullets = (deltaTime: number): void => {
  const state = useGameStore.getState();
  const meteorsMap = new Map(state.meteors.map((m) => [m.id, m]));
  const remainingBullets: Bullet[] = [];
  const updatedMeteors: Meteor[] = [...state.meteors];
  const newParticles: Particle[] = [];
  let hasHit = false;
  const meteorsToRemove: string[] = [];

  for (const bullet of state.bullets) {
    let target = meteorsMap.get(bullet.targetMeteorId);
    let { x, y, vx, vy } = bullet;
    const moveDist = bullet.speed * (deltaTime / 16);

    if (target) {
      const dx = target.x - x;
      const dy = target.y - y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        vx = (dx / len) * bullet.speed;
        vy = (dy / len) * bullet.speed;
      }
    }

    x += vx * (deltaTime / 16);
    y += vy * (deltaTime / 16);

    if (x < -50 || x > MAP_WIDTH + 50 || y < -50 || y > MAP_HEIGHT + 50) {
      continue;
    }

    let hit = false;
    if (target) {
      const dSq = distSq(x, y, target.x, target.y);
      const hitRadius = bullet.radius + target.radius;
      if (dSq < hitRadius * hitRadius) {
        hit = true;
        hasHit = true;
        const idx = updatedMeteors.findIndex((m) => m.id === target!.id);
        if (idx >= 0) {
          updatedMeteors[idx] = {
            ...updatedMeteors[idx],
            hp: updatedMeteors[idx].hp - bullet.damage,
          };
          newParticles.push(...createHitParticles(target.x, target.y));
          if (updatedMeteors[idx].hp <= 0) {
            meteorsToRemove.push(target.id);
          }
        }
      }
    }

    if (!hit) {
      for (const meteor of updatedMeteors) {
        if (meteorsToRemove.includes(meteor.id)) continue;
        const dSq = distSq(x, y, meteor.x, meteor.y);
        const hitRadius = bullet.radius + meteor.radius;
        if (dSq < hitRadius * hitRadius) {
          hit = true;
          hasHit = true;
          const idx = updatedMeteors.findIndex((m) => m.id === meteor.id);
          if (idx >= 0) {
            updatedMeteors[idx] = {
              ...updatedMeteors[idx],
              hp: updatedMeteors[idx].hp - bullet.damage,
            };
            newParticles.push(...createHitParticles(meteor.x, meteor.y));
            if (updatedMeteors[idx].hp <= 0) {
              meteorsToRemove.push(meteor.id);
            }
          }
          break;
        }
      }
    }

    if (!hit) {
      remainingBullets.push({ ...bullet, x, y, vx, vy });
    }
  }

  const finalMeteors = updatedMeteors.filter((m) => !meteorsToRemove.includes(m.id));
  for (const id of meteorsToRemove) {
    const destroyed = updatedMeteors.find((m) => m.id === id);
    if (destroyed) {
      const colors = ['#FF4500', '#FF6347', '#FF8C00', '#FFA500'];
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.3;
        const speed = 1 + Math.random() * 2;
        newParticles.push({
          id: uuidv4(),
          x: destroyed.x,
          y: destroyed.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 3 + Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 500,
          maxLife: 500,
        });
      }
    }
  }

  state.setBullets(remainingBullets);
  state.setMeteors(finalMeteors);
  if (newParticles.length > 0) {
    state.addParticles(newParticles);
  }
  if (hasHit) {
    state.triggerScreenShake();
  }
};

export const updateParticles = (deltaTime: number): void => {
  const state = useGameStore.getState();
  const updated: Particle[] = [];
  for (const p of state.particles) {
    const newLife = p.life - deltaTime;
    if (newLife <= 0) continue;
    updated.push({
      ...p,
      x: p.x + p.vx * (deltaTime / 16),
      y: p.y + p.vy * (deltaTime / 16),
      life: newLife,
    });
  }
  state.setParticles(updated);
};

export const getTowerAtPosition = (worldX: number, worldY: number): Tower | null => {
  const state = useGameStore.getState();
  const halfGrid = GRID_SIZE / 2;
  for (const tower of state.towers) {
    if (
      worldX >= tower.x - halfGrid &&
      worldX <= tower.x + halfGrid &&
      worldY >= tower.y - halfGrid &&
      worldY <= tower.y + halfGrid
    ) {
      return tower;
    }
  }
  return null;
};
