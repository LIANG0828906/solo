import { create } from 'zustand';

export type GameScreen = 'menu' | 'levelSelect' | 'playing' | 'paused' | 'result';

export type EntityType =
  | 'player'
  | 'platform'
  | 'crumbling'
  | 'spike'
  | 'drone'
  | 'turret'
  | 'bullet'
  | 'fragment'
  | 'exit';

export interface BaseEntity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  w: number;
  h: number;
  vx?: number;
  vy?: number;
  affectedByChrono?: boolean;
}

export interface PlayerEntity extends BaseEntity {
  type: 'player';
  health: number;
  maxHealth: number;
  facing: 1 | -1;
  isJumping: boolean;
  onGround: boolean;
  animFrame: number;
  animTimer: number;
  invincible: number;
}

export interface PlatformEntity extends BaseEntity {
  type: 'platform';
  affectedByChrono: false;
}

export interface CrumblingEntity extends BaseEntity {
  type: 'crumbling';
  stepped: boolean;
  stepTimer: number;
  fadeTimer: number;
  visible: boolean;
  respawnTimer: number;
  affectedByChrono: false;
}

export interface SpikeEntity extends BaseEntity {
  type: 'spike';
  cycleTimer: number;
  phase: 'safe' | 'warn' | 'danger' | 'retract';
  animTimer: number;
  affectedByChrono: false;
}

export interface DroneEntity extends BaseEntity {
  type: 'drone';
  patrolStart: number;
  patrolEnd: number;
  direction: 1 | -1;
  speed: number;
  affectedByChrono: true;
  animTimer: number;
}

export interface TurretEntity extends BaseEntity {
  type: 'turret';
  fireTimer: number;
  fireInterval: number;
  affectedByChrono: false;
}

export interface BulletEntity extends BaseEntity {
  type: 'bullet';
  vx: number;
  vy: number;
  life: number;
  affectedByChrono: false;
}

export interface FragmentEntity extends BaseEntity {
  type: 'fragment';
  collected: boolean;
  pulseTimer: number;
  affectedByChrono: false;
}

export interface ExitEntity extends BaseEntity {
  type: 'exit';
  affectedByChrono: false;
}

export type Entity =
  | PlayerEntity
  | PlatformEntity
  | CrumblingEntity
  | SpikeEntity
  | DroneEntity
  | TurretEntity
  | BulletEntity
  | FragmentEntity
  | ExitEntity;

export interface LevelData {
  id: number;
  name: string;
  width: number;
  height: number;
  entities: Entity[];
  totalFragments: number;
  playerStart: { x: number; y: number };
}

export interface GameState {
  currentScreen: GameScreen;
  currentLevel: number;
  levels: LevelData[];

  entities: Entity[];
  cameraX: number;

  player: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    health: number;
    maxHealth: number;
    facing: 1 | -1;
    isJumping: boolean;
    onGround: boolean;
    animFrame: number;
    invincible: number;
  };

  chronoField: {
    active: boolean;
    energy: number;
    maxEnergy: number;
    cooldown: boolean;
    cooldownTimer: number;
    continuousTime: number;
    maxContinuous: number;
  };

  collectedFragments: number;
  totalFragmentsInLevel: number;

  resultStars: number;

  uiAnim: {
    healthFlash: number;
    healthShake: number;
    energyShake: number;
  };

  chronoPulseTime: number;
}

export interface GameActions {
  goToMenu: () => void;
  goToLevelSelect: () => void;
  startGame: (levelId: number) => void;
  toggleChronoField: (on: boolean) => void;
  setPlayerInput: (vx: number, jump: boolean) => void;
  showResult: () => void;
  resetLevel: () => void;
  updateState: (delta: number) => void;
}

const emptyLevel: LevelData = {
  id: 0,
  name: '',
  width: 2400,
  height: 800,
  entities: [],
  totalFragments: 0,
  playerStart: { x: 100, y: 600 },
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  currentScreen: 'menu',
  currentLevel: 0,
  levels: [emptyLevel],

  entities: [],
  cameraX: 0,

  player: {
    x: 100,
    y: 600,
    vx: 0,
    vy: 0,
    health: 5,
    maxHealth: 5,
    facing: 1,
    isJumping: false,
    onGround: false,
    animFrame: 0,
    invincible: 0,
  },

  chronoField: {
    active: false,
    energy: 100,
    maxEnergy: 100,
    cooldown: false,
    cooldownTimer: 0,
    continuousTime: 0,
    maxContinuous: 3000,
  },

  collectedFragments: 0,
  totalFragmentsInLevel: 0,

  resultStars: 0,

  uiAnim: {
    healthFlash: 0,
    healthShake: 0,
    energyShake: 0,
  },

  chronoPulseTime: 0,

  goToMenu: () => {
    set({ currentScreen: 'menu' });
  },

  goToLevelSelect: () => {
    set({ currentScreen: 'levelSelect' });
  },

  startGame: (levelId: number) => {
    const level = get().levels[levelId] || get().levels[0];
    const playerStart = level.playerStart;
    set({
      currentScreen: 'playing',
      currentLevel: levelId,
      entities: JSON.parse(JSON.stringify(level.entities)),
      cameraX: 0,
      player: {
        x: playerStart.x,
        y: playerStart.y,
        vx: 0,
        vy: 0,
        health: 5,
        maxHealth: 5,
        facing: 1,
        isJumping: false,
        onGround: false,
        animFrame: 0,
        invincible: 0,
      },
      chronoField: {
        active: false,
        energy: 100,
        maxEnergy: 100,
        cooldown: false,
        cooldownTimer: 0,
        continuousTime: 0,
        maxContinuous: 3000,
      },
      collectedFragments: 0,
      totalFragmentsInLevel: level.totalFragments,
      uiAnim: { healthFlash: 0, healthShake: 0, energyShake: 0 },
    });
  },

  toggleChronoField: (on: boolean) => {
    const state = get();
    if (state.chronoField.cooldown) return;
    if (on && state.chronoField.energy <= 0) return;
    set((s) => ({
      chronoField: { ...s.chronoField, active: on },
    }));
  },

  setPlayerInput: (vx: number, jump: boolean) => {
    set((s) => {
      const player = { ...s.player };
      player.vx = vx;
      if (vx !== 0) player.facing = vx > 0 ? 1 : -1;
      if (jump && player.onGround) {
        player.vy = -520;
        player.isJumping = true;
        player.onGround = false;
      }
      return { player };
    });
  },

  showResult: () => {
    const state = get();
    const fragmentRatio = state.totalFragmentsInLevel > 0
      ? state.collectedFragments / state.totalFragmentsInLevel
      : 0;
    let stars = 1;
    if (fragmentRatio >= 0.4) stars = 2;
    if (fragmentRatio >= 0.8 && state.player.health >= 3) stars = 3;
    set({
      currentScreen: 'result',
      resultStars: stars,
    });
  },

  resetLevel: () => {
    get().startGame(get().currentLevel);
  },

  updateState: (delta: number) => {
    set((s) => {
      const uiAnim = { ...s.uiAnim };
      if (uiAnim.healthFlash > 0) uiAnim.healthFlash = Math.max(0, uiAnim.healthFlash - delta);
      if (uiAnim.healthShake > 0) uiAnim.healthShake = Math.max(0, uiAnim.healthShake - delta);
      if (uiAnim.energyShake > 0) uiAnim.energyShake = Math.max(0, uiAnim.energyShake - delta);

      const chronoField = { ...s.chronoField };
      if (chronoField.cooldown) {
        chronoField.cooldownTimer -= delta;
        if (chronoField.cooldownTimer <= 0) {
          chronoField.cooldown = false;
          chronoField.cooldownTimer = 0;
        }
      }
      if (chronoField.active && !chronoField.cooldown) {
        chronoField.continuousTime += delta;
        chronoField.energy = Math.max(0, chronoField.energy - (15 * delta / 1000));
        if (chronoField.energy <= 0 || chronoField.continuousTime >= chronoField.maxContinuous) {
          chronoField.active = false;
          chronoField.cooldown = true;
          chronoField.cooldownTimer = 2000;
          chronoField.continuousTime = 0;
        }
      } else if (!chronoField.cooldown) {
        chronoField.continuousTime = 0;
        chronoField.energy = Math.min(chronoField.maxEnergy, chronoField.energy + (25 * delta / 1000));
      }

      const chronoPulseTime = s.chronoPulseTime + delta / 1500;

      return { uiAnim, chronoField, chronoPulseTime };
    });
  },
}));
