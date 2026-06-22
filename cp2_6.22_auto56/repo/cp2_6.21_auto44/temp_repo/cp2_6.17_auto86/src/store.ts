import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  TowerType,
  EnemyType,
  GameStateType,
  TOWER_CONFIGS,
  ENEMY_CONFIGS,
  INITIAL_GOLD,
  INITIAL_LIVES,
  PATH_POINTS,
  MAX_TOWER_LEVEL,
  DAMAGE_UPGRADE_MULTIPLIER,
  RANGE_UPGRADE_INCREMENT,
  WAVE_COMPLETE_BONUS,
  SLOW_EFFECT_DURATION,
  SLOW_EFFECT_PERCENT,
} from './gameConfig';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  baseSpeed: number;
  pathIndex: number;
  slowTimer: number;
  reward: number;
  color: string;
  radius: number;
}

export interface Tower {
  id: string;
  type: TowerType;
  gridX: number;
  gridY: number;
  x: number;
  y: number;
  level: number;
  damage: number;
  range: number;
  attackSpeed: number;
  attackTimer: number;
  color: string;
}

export interface Projectile {
  id: string;
  type: TowerType;
  x: number;
  y: number;
  targetId: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  duration: number;
  damage: number;
}

export interface Effect {
  id: string;
  type: 'explosion' | 'hit' | 'slow';
  x: number;
  y: number;
  radius: number;
  progress: number;
  duration: number;
  color: string;
}

export interface HitParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  progress: number;
  duration: number;
  color: string;
}

interface GameStore {
  gameState: GameStateType;
  wave: number;
  gold: number;
  lives: number;
  enemies: Enemy[];
  towers: Tower[];
  projectiles: Projectile[];
  effects: Effect[];
  hitParticles: HitParticle[];
  selectedGridCell: { gridX: number; gridY: number } | null;
  selectedTower: string | null;
  waveInProgress: boolean;
  totalEnemiesInWave: number;
  enemiesSpawned: number;
  spawnTimer: number;
  score: number;

  setGameState: (state: GameStateType) => void;
  selectGridCell: (gridX: number, gridY: number) => void;
  selectTower: (towerId: string | null) => void;
  clearSelection: () => void;

  buildTower: (type: TowerType, gridX: number, gridY: number) => boolean;
  upgradeTower: (towerId: string) => boolean;
  startWave: () => void;

  spawnEnemy: (type: EnemyType) => void;
  updateEnemy: (id: string, x: number, y: number, pathIndex: number) => void;
  damageEnemy: (id: string, damage: number, slow?: boolean) => void;
  removeEnemy: (id: string, reachedEnd?: boolean) => void;
  clearEnemies: () => void;

  addProjectile: (projectile: Omit<Projectile, 'id'>) => void;
  updateProjectile: (id: string, x: number, y: number, progress: number) => void;
  removeProjectile: (id: string) => void;

  addEffect: (effect: Omit<Effect, 'id'>) => void;
  updateEffect: (id: string, progress: number) => void;
  removeEffect: (id: string) => void;

  addHitParticles: (x: number, y: number, color: string) => void;
  updateHitParticle: (id: string, x: number, y: number, progress: number) => void;
  removeHitParticle: (id: string) => void;

  updateTowerTimer: (id: string, timer: number) => void;

  reduceLives: () => void;
  addGold: (amount: number) => void;
  incrementWave: () => void;
  setWaveInProgress: (inProgress: boolean) => void;
  updateSpawnTimer: (timer: number) => void;
  incrementEnemiesSpawned: () => void;
  updateSlowTimers: (dt: number) => void;

  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'playing',
  wave: 0,
  gold: INITIAL_GOLD,
  lives: INITIAL_LIVES,
  enemies: [],
  towers: [],
  projectiles: [],
  effects: [],
  hitParticles: [],
  selectedGridCell: null,
  selectedTower: null,
  waveInProgress: false,
  totalEnemiesInWave: 0,
  enemiesSpawned: 0,
  spawnTimer: 0,
  score: 0,

  setGameState: (state) => set({ gameState: state }),
  selectGridCell: (gridX, gridY) =>
    set({ selectedGridCell: { gridX, gridY }, selectedTower: null }),
  selectTower: (towerId) => set({ selectedTower: towerId, selectedGridCell: null }),
  clearSelection: () => set({ selectedGridCell: null, selectedTower: null }),

  buildTower: (type, gridX, gridY) => {
    const config = TOWER_CONFIGS[type];
    const state = get();
    if (state.gold < config.cost) return false;
    const exists = state.towers.some(
      (t) => t.gridX === gridX && t.gridY === gridY
    );
    if (exists) return false;

    const tower: Tower = {
      id: uuidv4(),
      type,
      gridX,
      gridY,
      x: gridX * 40 + 20,
      y: gridY * 40 + 20,
      level: 1,
      damage: config.damage,
      range: config.range,
      attackSpeed: config.attackSpeed,
      attackTimer: 0,
      color: config.color,
    };

    set((s) => ({
      towers: [...s.towers, tower],
      gold: s.gold - config.cost,
      selectedGridCell: null,
    }));
    return true;
  },

  upgradeTower: (towerId) => {
    const state = get();
    const tower = state.towers.find((t) => t.id === towerId);
    if (!tower || tower.level >= MAX_TOWER_LEVEL) return false;
    if (state.gold < TOWER_CONFIGS[tower.type].upgradeCost) return false;

    set((s) => ({
      towers: s.towers.map((t) =>
        t.id === towerId
          ? {
              ...t,
              level: t.level + 1,
              damage: Math.floor(t.damage * DAMAGE_UPGRADE_MULTIPLIER),
              range: t.range + RANGE_UPGRADE_INCREMENT,
            }
          : t
      ),
      gold: s.gold - TOWER_CONFIGS[tower.type].upgradeCost,
    }));
    return true;
  },

  startWave: () => {
    const state = get();
    if (state.waveInProgress) return;
    const newWave = state.wave + 1;
    const isBossWave = newWave % 5 === 0;
    const baseCount = 10 + Math.floor(newWave * 0.5);
    const totalEnemies = isBossWave ? baseCount + 1 : Math.min(baseCount, 20);

    set({
      wave: newWave,
      waveInProgress: true,
      totalEnemiesInWave: totalEnemies,
      enemiesSpawned: 0,
      spawnTimer: 0,
    });
  },

  spawnEnemy: (type) => {
    const config = ENEMY_CONFIGS[type];
    const state = get();
    const hpMultiplier = 1 + (state.wave - 1) * 0.2;
    const startPoint = PATH_POINTS[0];

    const enemy: Enemy = {
      id: uuidv4(),
      type,
      x: startPoint.x,
      y: startPoint.y,
      hp: Math.floor(config.hp * hpMultiplier),
      maxHp: Math.floor(config.hp * hpMultiplier),
      speed: config.speed,
      baseSpeed: config.speed,
      pathIndex: 0,
      slowTimer: 0,
      reward: config.reward,
      color: config.color,
      radius: config.radius,
    };

    set((s) => ({
      enemies: [...s.enemies, enemy],
      enemiesSpawned: s.enemiesSpawned + 1,
    }));
  },

  updateEnemy: (id, x, y, pathIndex) => {
    set((s) => ({
      enemies: s.enemies.map((e) =>
        e.id === id ? { ...e, x, y, pathIndex } : e
      ),
    }));
  },

  damageEnemy: (id, damage, slow = false) => {
    const state = get();
    const enemy = state.enemies.find((e) => e.id === id);
    if (!enemy) return;

    const newHp = enemy.hp - damage;
    if (newHp <= 0) {
      get().removeEnemy(id, false);
      return;
    }

    set((s) => ({
      enemies: s.enemies.map((e) =>
        e.id === id
          ? {
              ...e,
              hp: newHp,
              slowTimer: slow ? SLOW_EFFECT_DURATION : e.slowTimer,
              speed: slow
                ? e.baseSpeed * (1 - SLOW_EFFECT_PERCENT)
                : e.speed,
            }
          : e
      ),
    }));
  },

  removeEnemy: (id, reachedEnd = false) => {
    const state = get();
    const enemy = state.enemies.find((e) => e.id === id);
    if (!enemy) return;

    let newLives = state.lives;
    let newGold = state.gold;
    let newScore = state.score;

    if (reachedEnd) {
      newLives -= 1;
    } else {
      newGold += enemy.reward;
      newScore += enemy.reward * 10;
    }

    const allSpawned = state.enemiesSpawned >= state.totalEnemiesInWave;
    const newEnemies = state.enemies.filter((e) => e.id !== id);
    const waveComplete =
      state.waveInProgress && allSpawned && newEnemies.length === 0;

    if (waveComplete) {
      newGold += WAVE_COMPLETE_BONUS;
    }

    const newGameState = newLives <= 0 ? 'lost' : state.gameState;

    set({
      enemies: newEnemies,
      gold: newGold,
      lives: newLives,
      score: newScore,
      gameState: newGameState,
      waveInProgress: waveComplete ? false : state.waveInProgress,
    });
  },

  clearEnemies: () => set({ enemies: [] }),

  addProjectile: (projectile) => {
    set((s) => ({
      projectiles: [...s.projectiles, { ...projectile, id: uuidv4() }],
    }));
  },

  updateProjectile: (id, x, y, progress) => {
    set((s) => ({
      projectiles: s.projectiles.map((p) =>
        p.id === id ? { ...p, x, y, progress } : p
      ),
    }));
  },

  removeProjectile: (id) => {
    set((s) => ({
      projectiles: s.projectiles.filter((p) => p.id !== id),
    }));
  },

  addEffect: (effect) => {
    set((s) => ({
      effects: [...s.effects, { ...effect, id: uuidv4() }],
    }));
  },

  updateEffect: (id, progress) => {
    set((s) => ({
      effects: s.effects.map((e) =>
        e.id === id ? { ...e, progress } : e
      ),
    }));
  },

  removeEffect: (id) => {
    set((s) => ({
      effects: s.effects.filter((e) => e.id !== id),
    }));
  },

  addHitParticles: (x, y, color) => {
    const particles: HitParticle[] = [];
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5 + Math.random() * 0.5;
      const speed = 30 + Math.random() * 20;
      particles.push({
        id: uuidv4(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        progress: 0,
        duration: 0.5,
        color,
      });
    }
    set((s) => ({
      hitParticles: [...s.hitParticles, ...particles],
    }));
  },

  updateHitParticle: (id, x, y, progress) => {
    set((s) => ({
      hitParticles: s.hitParticles.map((p) =>
        p.id === id ? { ...p, x, y, progress } : p
      ),
    }));
  },

  removeHitParticle: (id) => {
    set((s) => ({
      hitParticles: s.hitParticles.filter((p) => p.id !== id),
    }));
  },

  updateTowerTimer: (id, timer) => {
    set((s) => ({
      towers: s.towers.map((t) =>
        t.id === id ? { ...t, attackTimer: timer } : t
      ),
    }));
  },

  reduceLives: () => {
    const state = get();
    const newLives = state.lives - 1;
    set({
      lives: newLives,
      gameState: newLives <= 0 ? 'lost' : state.gameState,
    });
  },

  addGold: (amount) => set((s) => ({ gold: s.gold + amount })),

  incrementWave: () => set((s) => ({ wave: s.wave + 1 })),

  setWaveInProgress: (inProgress) => set({ waveInProgress: inProgress }),

  updateSpawnTimer: (timer) => set({ spawnTimer: timer }),

  incrementEnemiesSpawned: () =>
    set((s) => ({ enemiesSpawned: s.enemiesSpawned + 1 })),

  updateSlowTimers: (dt) => {
    set((s) => ({
      enemies: s.enemies.map((e) => {
        if (e.slowTimer <= 0) return e;
        const newTimer = e.slowTimer - dt;
        if (newTimer <= 0) {
          return { ...e, slowTimer: 0, speed: e.baseSpeed };
        }
        return { ...e, slowTimer: newTimer };
      }),
    }));
  },

  resetGame: () =>
    set({
      gameState: 'playing',
      wave: 0,
      gold: INITIAL_GOLD,
      lives: INITIAL_LIVES,
      enemies: [],
      towers: [],
      projectiles: [],
      effects: [],
      hitParticles: [],
      selectedGridCell: null,
      selectedTower: null,
      waveInProgress: false,
      totalEnemiesInWave: 0,
      enemiesSpawned: 0,
      spawnTimer: 0,
      score: 0,
    }),
}));
