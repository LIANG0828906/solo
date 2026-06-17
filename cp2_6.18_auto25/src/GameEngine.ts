import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { MapGenerator, Cell, START_POINT } from './MapGenerator';

export type TowerType = 'cannon' | 'ice' | 'poison';

export interface Tower {
  id: string;
  type: TowerType;
  x: number;
  y: number;
  level: number;
  attack: number;
  range: number;
  attackSpeed: number;
  lastAttackTime: number;
  upgrading: boolean;
  upgradeStartTime: number;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  pathIndex: number;
  slowEffect: { multiplier: number; duration: number } | null;
  poisonEffect: { damage: number; duration: number; lastTick: number } | null;
}

export interface Projectile {
  id: string;
  type: TowerType;
  x: number;
  y: number;
  targetId: string;
  damage: number;
  speed: number;
}

export interface Particle {
  id: string;
  type: 'snow' | 'poison' | 'upgrade' | 'bullet' | 'ripple' | 'explosion';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface GameState {
  grid: Cell[][];
  path: { x: number; y: number }[];
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  particles: Particle[];
  gold: number;
  lives: number;
  wave: number;
  maxWaves: number;
  waveInProgress: boolean;
  waveTimer: number;
  gameOver: boolean;
  victory: boolean;
  selectedCell: { x: number; y: number } | null;
  selectedTower: string | null;
  lastTime: number;
  enemiesSpawned: number;
  enemiesPerWave: number;
  spawnTimer: number;
  waveAnnouncement: boolean;
  waveAnnouncementTime: number;
  goldAnimating: boolean;
  livesAnimating: boolean;
  waveAnimating: boolean;
}

export interface GameActions {
  initializeGame: () => void;
  regenerateMap: () => void;
  selectCell: (x: number, y: number) => void;
  deselectCell: () => void;
  buildTower: (type: TowerType) => void;
  upgradeTower: (towerId: string) => void;
  startNextWave: () => void;
  update: (deltaTime: number) => void;
}

const TOWER_CONFIGS: Record<TowerType, Omit<Tower, 'id' | 'x' | 'y' | 'level' | 'lastAttackTime' | 'upgrading' | 'upgradeStartTime'>> = {
  cannon: { type: 'cannon', attack: 10, range: 3, attackSpeed: 1 },
  ice: { type: 'ice', attack: 5, range: 2, attackSpeed: 0.5 },
  poison: { type: 'poison', attack: 8, range: 4, attackSpeed: 0.7 },
};

const TOWER_COSTS: Record<TowerType, number> = {
  cannon: 50,
  ice: 60,
  poison: 55,
};

const UPGRADE_COST_MULTIPLIER = 1.5;
const MAX_TOWER_LEVEL = 3;
const WAVE_INTERVAL = 8000;
const SPAWN_INTERVAL = 500;
const ENEMY_BASE_HP = 30;
const ENEMY_HP_INCREMENT = 20;
const ENEMY_SPEED = 1;
const ENEMY_GOLD_REWARD = 5;
const INITIAL_GOLD = 100;
const INITIAL_LIVES = 10;
const MAX_WAVES = 5;
const MAX_ENEMIES_PER_WAVE = 20;
const MAX_PARTICLES = 50;

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  grid: [],
  path: [],
  towers: [],
  enemies: [],
  projectiles: [],
  particles: [],
  gold: INITIAL_GOLD,
  lives: INITIAL_LIVES,
  wave: 0,
  maxWaves: MAX_WAVES,
  waveInProgress: false,
  waveTimer: WAVE_INTERVAL,
  gameOver: false,
  victory: false,
  selectedCell: null,
  selectedTower: null,
  lastTime: 0,
  enemiesSpawned: 0,
  enemiesPerWave: 8,
  spawnTimer: 0,
  waveAnnouncement: false,
  waveAnnouncementTime: 0,
  goldAnimating: false,
  livesAnimating: false,
  waveAnimating: false,

  initializeGame: () => {
    const mapData = MapGenerator.generate();
    set({
      grid: mapData.grid,
      path: mapData.path,
      towers: [],
      enemies: [],
      projectiles: [],
      particles: [],
      gold: INITIAL_GOLD,
      lives: INITIAL_LIVES,
      wave: 0,
      waveInProgress: false,
      waveTimer: WAVE_INTERVAL,
      gameOver: false,
      victory: false,
      selectedCell: null,
      selectedTower: null,
      enemiesSpawned: 0,
      spawnTimer: 0,
      waveAnnouncement: false,
      waveAnnouncementTime: 0,
      goldAnimating: false,
      livesAnimating: false,
      waveAnimating: false,
    });
  },

  regenerateMap: () => {
    const mapData = MapGenerator.generate();
    set({
      grid: mapData.grid,
      path: mapData.path,
      enemies: [],
      projectiles: [],
      particles: [],
    });
  },

  selectCell: (x: number, y: number) => {
    const state = get();
    const cell = state.grid[y]?.[x];
    if (!cell) return;

    const existingTower = state.towers.find(t => t.x === x && t.y === y);
    if (existingTower) {
      set({ selectedTower: existingTower.id, selectedCell: null });
    } else if (cell.type === 'empty') {
      set({ selectedCell: { x, y }, selectedTower: null });
    }
  },

  deselectCell: () => {
    set({ selectedCell: null, selectedTower: null });
  },

  buildTower: (type: TowerType) => {
    const state = get();
    if (!state.selectedCell) return;

    const cost = TOWER_COSTS[type];
    if (state.gold < cost) return;

    const config = TOWER_CONFIGS[type];
    const tower: Tower = {
      id: uuidv4(),
      type,
      x: state.selectedCell.x,
      y: state.selectedCell.y,
      level: 1,
      attack: config.attack,
      range: config.range,
      attackSpeed: config.attackSpeed,
      lastAttackTime: 0,
      upgrading: false,
      upgradeStartTime: 0,
    };

    const rippleParticle: Particle = {
      id: uuidv4(),
      type: 'ripple',
      x: state.selectedCell.x + 0.5,
      y: state.selectedCell.y + 0.5,
      vx: 0,
      vy: 0,
      life: 500,
      maxLife: 500,
      color: '#00ABB3',
      size: 1,
    };

    set({
      towers: [...state.towers, tower],
      gold: state.gold - cost,
      selectedCell: null,
      particles: [...state.particles.slice(-(MAX_PARTICLES - 1)), rippleParticle],
      goldAnimating: true,
    });

    setTimeout(() => {
      set({ goldAnimating: false });
    }, 200);
  },

  upgradeTower: (towerId: string) => {
    const state = get();
    const tower = state.towers.find(t => t.id === towerId);
    if (!tower || tower.level >= MAX_TOWER_LEVEL) return;

    const baseCost = TOWER_COSTS[tower.type];
    const upgradeCost = Math.floor(baseCost * Math.pow(UPGRADE_COST_MULTIPLIER, tower.level));
    if (state.gold < upgradeCost) return;

    const upgradedTowers = state.towers.map(t =>
      t.id === towerId
        ? {
            ...t,
            level: t.level + 1,
            attack: t.attack + 5,
            range: t.range + 1,
            upgrading: true,
            upgradeStartTime: performance.now(),
          }
        : t
    );

    const upgradeParticles: Particle[] = [];
    for (let i = 0; i < 10; i++) {
      upgradeParticles.push({
        id: uuidv4(),
        type: 'upgrade',
        x: tower.x + 0.5,
        y: tower.y + 0.5,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 3 - 1,
        life: 300,
        maxLife: 300,
        color: '#FFD700',
        size: 4,
      });
    }

    const rippleParticle: Particle = {
      id: uuidv4(),
      type: 'ripple',
      x: tower.x + 0.5,
      y: tower.y + 0.5,
      vx: 0,
      vy: 0,
      life: 500,
      maxLife: 500,
      color: '#00ABB3',
      size: 1,
    };

    const allParticles = [...upgradeParticles, rippleParticle];

    set({
      towers: upgradedTowers,
      gold: state.gold - upgradeCost,
      particles: [...state.particles.slice(-(MAX_PARTICLES - allParticles.length)), ...allParticles],
      goldAnimating: true,
    });

    setTimeout(() => {
      set({ goldAnimating: false });
    }, 200);
  },

  startNextWave: () => {
    const state = get();
    if (state.waveInProgress || state.gameOver || state.victory) return;
    if (state.wave >= state.maxWaves) return;

    const nextWave = state.wave + 1;
    const enemiesPerWave = Math.min(5 + nextWave * 3, MAX_ENEMIES_PER_WAVE);

    set({
      wave: nextWave,
      waveInProgress: true,
      enemiesSpawned: 0,
      enemiesPerWave,
      spawnTimer: 0,
      waveAnnouncement: true,
      waveAnnouncementTime: 1500,
      waveAnimating: true,
    });

    setTimeout(() => {
      set({ waveAnimating: false });
    }, 200);
  },

  update: (deltaTime: number) => {
    const state = get();
    if (state.gameOver || state.victory) return;

    let { enemies, towers, projectiles, particles, gold, lives, waveInProgress, wave, enemiesSpawned, enemiesPerWave, spawnTimer, waveAnnouncement, waveAnnouncementTime } = state;
    const currentTime = performance.now();

    if (waveAnnouncement) {
      waveAnnouncementTime -= deltaTime;
      if (waveAnnouncementTime <= 0) {
        waveAnnouncement = false;
      }
    }

    let shouldTriggerWaveAnim = false;

    if (!waveInProgress && wave < state.maxWaves) {
      state.waveTimer -= deltaTime;
      if (state.waveTimer <= 0) {
        const nextWave = wave + 1;
        const newEnemiesPerWave = Math.min(5 + nextWave * 3, MAX_ENEMIES_PER_WAVE);
        wave = nextWave;
        waveInProgress = true;
        enemiesSpawned = 0;
        enemiesPerWave = newEnemiesPerWave;
        spawnTimer = 0;
        waveAnnouncement = true;
        waveAnnouncementTime = 1500;
        shouldTriggerWaveAnim = true;
      }
    }

    if (waveInProgress) {
      spawnTimer += deltaTime;
      if (spawnTimer >= SPAWN_INTERVAL && enemiesSpawned < enemiesPerWave) {
        const hp = ENEMY_BASE_HP + (wave - 1) * ENEMY_HP_INCREMENT;
        const newEnemy: Enemy = {
          id: uuidv4(),
          x: START_POINT.x + 0.5,
          y: START_POINT.y + 0.5,
          hp,
          maxHp: hp,
          speed: ENEMY_SPEED,
          pathIndex: 0,
          slowEffect: null,
          poisonEffect: null,
        };
        enemies = [...enemies, newEnemy];
        enemiesSpawned++;
        spawnTimer = 0;
      }

      if (enemiesSpawned >= enemiesPerWave && enemies.length === 0) {
        waveInProgress = false;
        state.waveTimer = WAVE_INTERVAL;
        
        if (wave >= state.maxWaves) {
          set({ victory: true, waveInProgress: false });
          return;
        }
      }
    }

    const newParticles: Particle[] = [...particles];
    const updatedEnemies: Enemy[] = [];
    let livesLost = 0;
    let goldGained = 0;

    for (const enemy of enemies) {
      let { x, y, hp, pathIndex, slowEffect, poisonEffect } = enemy;
      let speed = enemy.speed;

      if (slowEffect) {
        speed *= slowEffect.multiplier;
        slowEffect = {
          ...slowEffect,
          duration: slowEffect.duration - deltaTime,
        };
        if (slowEffect.duration <= 0) slowEffect = null;
      }

      if (poisonEffect) {
        const timeSinceLastTick = currentTime - poisonEffect.lastTick;
        if (timeSinceLastTick >= 1000) {
          hp -= poisonEffect.damage;
          poisonEffect = {
            ...poisonEffect,
            lastTick: currentTime,
          };
        }
        poisonEffect = {
          ...poisonEffect,
          duration: poisonEffect.duration - deltaTime,
        };
        if (poisonEffect.duration <= 0) poisonEffect = null;
      }

      if (hp <= 0) {
        goldGained += ENEMY_GOLD_REWARD;
        const particleCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
          const speed = 2 + Math.random() * 2;
          newParticles.push({
            id: uuidv4(),
            type: 'explosion',
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 300,
            maxLife: 300,
            color: '#FF8C00',
            size: 6,
          });
        }
        continue;
      }

      const targetPoint = state.path[pathIndex];
      if (!targetPoint) {
        livesLost++;
        continue;
      }

      const targetX = targetPoint.x + 0.5;
      const targetY = targetPoint.y + 0.5;
      const dx = targetX - x;
      const dy = targetY - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.1) {
        pathIndex++;
        if (pathIndex >= state.path.length) {
          livesLost++;
          continue;
        }
      } else {
        const moveSpeed = speed * (deltaTime / 1000);
        x += (dx / dist) * moveSpeed;
        y += (dy / dist) * moveSpeed;
      }

      updatedEnemies.push({
        ...enemy,
        x,
        y,
        hp,
        pathIndex,
        slowEffect,
        poisonEffect,
      });
    }

    const updatedTowers = towers.map(tower => {
      if (tower.upgrading && currentTime - tower.upgradeStartTime > 300) {
        return { ...tower, upgrading: false };
      }

      const attackInterval = 1000 / tower.attackSpeed;
      if (currentTime - tower.lastAttackTime < attackInterval) return tower;

      const towerCenterX = tower.x + 0.5;
      const towerCenterY = tower.y + 0.5;

      let nearestEnemy: Enemy | null = null;
      let nearestDist = Infinity;

      for (const enemy of updatedEnemies) {
        const dx = enemy.x - towerCenterX;
        const dy = enemy.y - towerCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= tower.range && dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = enemy;
        }
      }

      if (nearestEnemy) {
        const newProjectile: Projectile = {
          id: uuidv4(),
          type: tower.type,
          x: towerCenterX,
          y: towerCenterY,
          targetId: nearestEnemy.id,
          damage: tower.attack,
          speed: 10,
        };
        projectiles = [...projectiles, newProjectile];
        return { ...tower, lastAttackTime: currentTime };
      }

      return tower;
    });

    const updatedProjectiles: Projectile[] = [];

    for (const proj of projectiles) {
      const target = updatedEnemies.find(e => e.id === proj.targetId);
      if (!target) continue;

      const dx = target.x - proj.x;
      const dy = target.y - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.3) {
        target.hp -= proj.damage;

        if (proj.type === 'ice') {
          target.slowEffect = { multiplier: 0.5, duration: 2000 };
          for (let i = 0; i < 5; i++) {
            newParticles.push({
              id: uuidv4(),
              type: 'snow',
              x: target.x,
              y: target.y,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              life: 500,
              maxLife: 500,
              color: '#87CEEB',
              size: 6,
            });
          }
        }

        if (proj.type === 'poison') {
          target.poisonEffect = { damage: 3, duration: 3000, lastTick: currentTime };
          for (let i = 0; i < 5; i++) {
            newParticles.push({
              id: uuidv4(),
              type: 'poison',
              x: target.x,
              y: target.y,
              vx: (Math.random() - 0.5) * 2,
              vy: -Math.random() * 2,
              life: 800,
              maxLife: 800,
              color: '#32CD32',
              size: 5,
            });
          }
        }

        if (proj.type === 'cannon') {
          for (let i = 0; i < 3; i++) {
            newParticles.push({
              id: uuidv4(),
              type: 'bullet',
              x: target.x,
              y: target.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              life: 200,
              maxLife: 200,
              color: '#FFD700',
              size: 3,
            });
          }
        }
      } else {
        const moveSpeed = proj.speed * (deltaTime / 1000);
        updatedProjectiles.push({
          ...proj,
          x: proj.x + (dx / dist) * moveSpeed,
          y: proj.y + (dy / dist) * moveSpeed,
        });
      }
    }

    const updatedParticles = newParticles
      .map(p => {
        if (p.type === 'ripple') {
          const progress = 1 - p.life / p.maxLife;
          return {
            ...p,
            size: 1 + progress * 3,
            life: p.life - deltaTime,
          };
        }
        return {
          ...p,
          x: p.x + p.vx * (deltaTime / 1000),
          y: p.y + p.vy * (deltaTime / 1000),
          life: p.life - deltaTime,
        };
      })
      .filter(p => p.life > 0)
      .slice(-MAX_PARTICLES);

    const newLives = lives - livesLost;
    const newGold = gold + goldGained;

    const goldChanged = goldGained > 0;
    const livesChanged = livesLost > 0;

    if (newLives <= 0) {
      set({
        enemies: updatedEnemies,
        towers: updatedTowers,
        projectiles: updatedProjectiles,
        particles: updatedParticles,
        lives: 0,
        gold: newGold,
        gameOver: true,
        waveAnnouncement,
        waveAnnouncementTime,
      });
      return;
    }

    set({
      enemies: updatedEnemies,
      towers: updatedTowers,
      projectiles: updatedProjectiles,
      particles: updatedParticles,
      lives: newLives,
      gold: newGold,
      wave,
      waveInProgress,
      enemiesSpawned,
      enemiesPerWave,
      spawnTimer,
      waveAnnouncement,
      waveAnnouncementTime,
      goldAnimating: goldChanged || state.goldAnimating,
      livesAnimating: livesChanged || state.livesAnimating,
      waveAnimating: shouldTriggerWaveAnim || state.waveAnimating,
    });

    if (goldChanged && !state.goldAnimating) {
      setTimeout(() => {
        set({ goldAnimating: false });
      }, 200);
    }
    if (livesChanged && !state.livesAnimating) {
      setTimeout(() => {
        set({ livesAnimating: false });
      }, 200);
    }
    if (shouldTriggerWaveAnim && !state.waveAnimating) {
      setTimeout(() => {
        set({ waveAnimating: false });
      }, 200);
    }
  },
}));

export const getTowerUpgradeCost = (tower: Tower): number => {
  const baseCost = TOWER_COSTS[tower.type];
  return Math.floor(baseCost * Math.pow(UPGRADE_COST_MULTIPLIER, tower.level));
};

export const getTowerCost = (type: TowerType): number => {
  return TOWER_COSTS[type];
};
