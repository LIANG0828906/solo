import {
  PATH_POINTS,
  GRID_SIZE,
  TOWER_CONFIGS,
  ENEMY_CONFIGS,
  EnemyType,
} from './gameConfig';
import { useGameStore, Enemy, Tower, Projectile, Effect } from './store';

let animationFrameId: number | null = null;
let lastTime = 0;
let isRunning = false;

const getDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

const findEnemyInRange = (tower: Tower, enemies: Enemy[]): Enemy | null => {
  let closest: Enemy | null = null;
  let minDist = Infinity;
  const rangePixels = tower.range * GRID_SIZE;

  for (const enemy of enemies) {
    const dist = getDistance(tower.x, tower.y, enemy.x, enemy.y);
    if (dist <= rangePixels && dist < minDist) {
      minDist = dist;
      closest = enemy;
    }
  }
  return closest;
};

const findEnemiesInRange = (
  centerX: number,
  centerY: number,
  range: number,
  enemies: Enemy[]
): Enemy[] => {
  const rangePixels = range * GRID_SIZE;
  return enemies.filter(
    (e) => getDistance(centerX, centerY, e.x, e.y) <= rangePixels
  );
};

const moveEnemy = (enemy: Enemy, dt: number): { reachedEnd: boolean; x: number; y: number; pathIndex: number } => {
  let x = enemy.x;
  let y = enemy.y;
  let pathIndex = enemy.pathIndex;
  const speedPixelsPerSec = enemy.speed * GRID_SIZE;
  let remainingDist = speedPixelsPerSec * dt;

  while (remainingDist > 0 && pathIndex < PATH_POINTS.length - 1) {
    const nextPoint = PATH_POINTS[pathIndex + 1];
    const distToNext = getDistance(x, y, nextPoint.x, nextPoint.y);

    if (distToNext <= remainingDist) {
      x = nextPoint.x;
      y = nextPoint.y;
      pathIndex += 1;
      remainingDist -= distToNext;
    } else {
      const ratio = remainingDist / distToNext;
      x += (nextPoint.x - x) * ratio;
      y += (nextPoint.y - y) * ratio;
      remainingDist = 0;
    }
  }

  const reachedEnd = pathIndex >= PATH_POINTS.length - 1;
  return { reachedEnd, x, y, pathIndex };
};

const spawnWaveEnemy = (wave: number): EnemyType => {
  const isBossWave = wave % 5 === 0;
  const state = useGameStore.getState();

  if (isBossWave && state.enemiesSpawned === state.totalEnemiesInWave - 1) {
    return 'boss';
  }

  const rand = Math.random();
  if (wave >= 3 && rand < 0.2) {
    return 'heavy';
  } else if (wave >= 2 && rand < 0.4) {
    return 'fast';
  }
  return 'normal';
};

const towerAttack = (tower: Tower, enemies: Enemy[], now: number): void => {
  const state = useGameStore.getState();

  if (tower.attackTimer > 0) {
    return;
  }

  const target = findEnemyInRange(tower, enemies);
  if (!target) return;

  const config = TOWER_CONFIGS[tower.type];

  if (tower.type === 'archer') {
    const projectile: Omit<Projectile, 'id'> = {
      type: 'archer',
      x: tower.x,
      y: tower.y,
      targetId: target.id,
      startX: tower.x,
      startY: tower.y,
      targetX: target.x,
      targetY: target.y,
      progress: 0,
      duration: 0.2,
      damage: tower.damage,
    };
    state.addProjectile(projectile);
  } else if (tower.type === 'cannon') {
    const projectile: Omit<Projectile, 'id'> = {
      type: 'cannon',
      x: tower.x,
      y: tower.y,
      targetId: target.id,
      startX: tower.x,
      startY: tower.y,
      targetX: target.x,
      targetY: target.y,
      progress: 0,
      duration: 0.3,
      damage: tower.damage,
    };
    state.addProjectile(projectile);
  } else if (tower.type === 'mage') {
    const projectile: Omit<Projectile, 'id'> = {
      type: 'mage',
      x: tower.x,
      y: tower.y,
      targetId: target.id,
      startX: tower.x,
      startY: tower.y,
      targetX: target.x,
      targetY: target.y,
      progress: 0,
      duration: 0.4,
      damage: tower.damage,
    };
    state.addProjectile(projectile);
  }

  useGameStore.setState((s) => ({
    towers: s.towers.map((t) =>
      t.id === tower.id ? { ...t, attackTimer: config.attackSpeed } : t
    ),
  }));

  void now;
};

const updateProjectiles = (dt: number): void => {
  const state = useGameStore.getState();
  const projectilesToRemove: string[] = [];

  for (const proj of state.projectiles) {
    const newProgress = proj.progress + dt / proj.duration;

    if (newProgress >= 1) {
      projectilesToRemove.push(proj.id);

      if (proj.type === 'archer') {
        const target = state.enemies.find((e) => e.id === proj.targetId);
        if (target) {
          state.damageEnemy(target.id, proj.damage, false);
          state.addHitParticles(target.x, target.y, '#FFFFFF');
        }
      } else if (proj.type === 'cannon') {
        const effect: Omit<Effect, 'id'> = {
          type: 'explosion',
          x: proj.targetX,
          y: proj.targetY,
          radius: 20,
          progress: 0,
          duration: 0.3,
          color: '#FFA500',
        };
        state.addEffect(effect);

        const targets = findEnemiesInRange(proj.targetX, proj.targetY, 0.5, state.enemies);
        for (const t of targets) {
          state.damageEnemy(t.id, proj.damage, false);
          state.addHitParticles(t.x, t.y, '#FFA500');
        }
      } else if (proj.type === 'mage') {
        const target = state.enemies.find((e) => e.id === proj.targetId);
        if (target) {
          state.damageEnemy(target.id, proj.damage, true);
          state.addHitParticles(target.x, target.y, '#9B59B6');
        }
      }
    } else {
      let newX: number, newY: number;
      const target = state.enemies.find((e) => e.id === proj.targetId);
      const actualTargetX = target ? target.x : proj.targetX;
      const actualTargetY = target ? target.y : proj.targetY;

      if (proj.type === 'mage') {
        const t = newProgress;
        const baseX = proj.startX + (actualTargetX - proj.startX) * t;
        const baseY = proj.startY + (actualTargetY - proj.startY) * t;
        const arcHeight = 60 * Math.sin(Math.PI * t);
        newX = baseX;
        newY = baseY - arcHeight;
      } else {
        newX = proj.startX + (actualTargetX - proj.startX) * newProgress;
        newY = proj.startY + (actualTargetY - proj.startY) * newProgress;
      }

      state.updateProjectile(proj.id, newX, newY, newProgress);
    }
  }

  for (const id of projectilesToRemove) {
    state.removeProjectile(id);
  }
};

const updateEffects = (dt: number): void => {
  const state = useGameStore.getState();
  const effectsToRemove: string[] = [];

  for (const effect of state.effects) {
    const newProgress = effect.progress + dt / effect.duration;
    if (newProgress >= 1) {
      effectsToRemove.push(effect.id);
    } else {
      state.updateEffect(effect.id, newProgress);
    }
  }

  for (const id of effectsToRemove) {
    state.removeEffect(id);
  }
};

const updateHitParticles = (dt: number): void => {
  const state = useGameStore.getState();
  const toRemove: string[] = [];

  for (const p of state.hitParticles) {
    const newProgress = p.progress + dt / p.duration;
    if (newProgress >= 1) {
      toRemove.push(p.id);
    } else {
      const newX = p.x + p.vx * dt;
      const newY = p.y + p.vy * dt;
      state.updateHitParticle(p.id, newX, newY, newProgress);
    }
  }

  for (const id of toRemove) {
    state.removeHitParticle(id);
  }
};

const updateTowerTimers = (dt: number): void => {
  const state = useGameStore.getState();
  for (const tower of state.towers) {
    if (tower.attackTimer > 0) {
      const newTimer = Math.max(0, tower.attackTimer - dt);
      state.updateTowerTimer(tower.id, newTimer);
    }
  }
};

const gameLoop = (timestamp: number): void => {
  if (!isRunning) return;

  if (!lastTime) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  const state = useGameStore.getState();

  if (state.gameState !== 'playing') {
    animationFrameId = requestAnimationFrame(gameLoop);
    return;
  }

  state.updateSlowTimers(dt);

  const enemiesToRemove: string[] = [];
  for (const enemy of state.enemies) {
    const result = moveEnemy(enemy, dt);
    if (result.reachedEnd) {
      enemiesToRemove.push(enemy.id);
    } else {
      state.updateEnemy(enemy.id, result.x, result.y, result.pathIndex);
    }
  }
  for (const id of enemiesToRemove) {
    state.removeEnemy(id, true);
  }

  updateTowerTimers(dt);

  const currentState = useGameStore.getState();
  for (const tower of currentState.towers) {
    if (tower.attackTimer <= 0) {
      towerAttack(tower, currentState.enemies, timestamp);
    }
  }

  updateProjectiles(dt);
  updateEffects(dt);
  updateHitParticles(dt);

  const spawnState = useGameStore.getState();
  if (
    spawnState.waveInProgress &&
    spawnState.enemiesSpawned < spawnState.totalEnemiesInWave
  ) {
    const newSpawnTimer = spawnState.spawnTimer + dt;
    if (newSpawnTimer >= 0.8) {
      const enemyType = spawnWaveEnemy(spawnState.wave);
      spawnState.spawnEnemy(enemyType);
      spawnState.updateSpawnTimer(0);
    } else {
      spawnState.updateSpawnTimer(newSpawnTimer);
    }
  }

  animationFrameId = requestAnimationFrame(gameLoop);
};

export const startGame = (): void => {
  if (isRunning) return;
  isRunning = true;
  lastTime = 0;
  animationFrameId = requestAnimationFrame(gameLoop);
};

export const stopGame = (): void => {
  isRunning = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

export const isGameRunning = (): boolean => isRunning;

void ENEMY_CONFIGS;
