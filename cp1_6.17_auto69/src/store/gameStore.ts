import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Vector2,
  Ship,
  Asteroid,
  Bullet,
  Particle,
  Player,
  GameStateType,
  UpgradeType,
  GameStats,
} from '../game/types';

interface GameStore {
  gameState: GameStateType;
  players: Player[];
  ships: Ship[];
  asteroids: Asteroid[];
  bullets: Bullet[];
  particles: Particle[];
  canvasWidth: number;
  canvasHeight: number;
  winnerId: string | null;
  stats: GameStats;

  initGame: (w: number, h: number) => void;
  updateShip: (id: string, partial: Partial<Ship>) => void;
  addAsteroid: (asteroid?: Partial<Asteroid>) => Asteroid;
  removeAsteroid: (id: string) => void;
  updateAsteroid: (id: string, partial: Partial<Asteroid>) => void;
  addBullet: (bullet?: Partial<Bullet>) => Bullet;
  removeBullet: (id: string) => void;
  updateBullet: (id: string, partial: Partial<Bullet>) => void;
  addParticle: (particle?: Partial<Particle>) => Particle;
  removeParticle: (id: string) => void;
  updateParticle: (id: string, partial: Partial<Particle>) => void;
  damageShip: (shipId: string, damage: number) => void;
  collectMinerals: (shipId: string, amount: number) => void;
  activateShield: (shipId: string) => void;
  startMining: (shipId: string, asteroidId: string) => void;
  stopMining: (shipId: string) => void;
  upgradeShip: (shipId: string, type: UpgradeType) => void;
  addKill: (killerId: string) => void;
  endGame: (winnerId: string) => void;
  resetGame: () => void;
  setCanvasSize: (w: number, h: number) => void;
}

const generateAsteroidVertices = (radius: number): Vector2[] => {
  const vertices: Vector2[] = [];
  const numVertices = 8 + Math.floor(Math.random() * 5);
  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * Math.PI * 2;
    const r = radius * (0.7 + Math.random() * 0.6);
    vertices.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    });
  }
  return vertices;
};

const createAsteroid = (canvasWidth: number, canvasHeight: number, partial?: Partial<Asteroid>): Asteroid => {
  const radius = partial?.radius ?? 20 + Math.random() * 40;
  const maxMinerals = partial?.maxMinerals ?? Math.floor(radius * 2);
  const position = partial?.position ?? {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
  };
  return {
    id: uuidv4(),
    position,
    radius,
    rotation: partial?.rotation ?? Math.random() * Math.PI * 2,
    rotationSpeed: partial?.rotationSpeed ?? (Math.random() - 0.5) * 0.02,
    minerals: partial?.minerals ?? maxMinerals,
    maxMinerals,
    color: partial?.color ?? `hsl(${30 + Math.random() * 20}, 30%, ${40 + Math.random() * 20}%)`,
    fragments: partial?.fragments ?? Math.floor(radius / 10),
    vertices: partial?.vertices ?? generateAsteroidVertices(radius),
  };
};

const createShip = (playerId: string, name: string, color: string, x: number, y: number): Ship => ({
  id: uuidv4(),
  playerId,
  position: { x, y },
  velocity: { x: 0, y: 0 },
  rotation: Math.random() * Math.PI * 2,
  health: 100,
  maxHealth: 100,
  minerals: 0,
  color,
  speed: 3,
  fireRate: 500,
  shieldMax: 50,
  shieldActive: false,
  isShieldActive: false,
  shieldHp: 0,
  shieldHealth: 0,
  shieldCooldown: 0,
  weaponCooldown: 0,
  isMining: false,
  miningTarget: null,
  upgradeFlash: 0,
});

const initialStats: GameStats = {
  startTime: 0,
  elapsedTime: 0,
  totalBulletsFired: 0,
  totalMineralsMined: 0,
  asteroidsDestroyed: 0,
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'menu',
  players: [],
  ships: [],
  asteroids: [],
  bullets: [],
  particles: [],
  canvasWidth: 800,
  canvasHeight: 600,
  winnerId: null,
  stats: { ...initialStats },

  initGame: (w: number, h: number) => {
    const player1Id = uuidv4();
    const player2Id = uuidv4();
    const ship1 = createShip(player1Id, '玩家1', '#4fc3f7', w * 0.25, h * 0.5);
    const ship2 = createShip(player2Id, '玩家2', '#ef5350', w * 0.75, h * 0.5);

    const asteroidCount = Math.floor((w * h) / 60000);
    const asteroids: Asteroid[] = [];
    for (let i = 0; i < asteroidCount; i++) {
      asteroids.push(createAsteroid(w, h));
    }

    set({
      gameState: 'playing',
      players: [
        { id: player1Id, name: '玩家1', color: '#4fc3f7', kills: 0, mineralsCollected: 0 },
        { id: player2Id, name: '玩家2', color: '#ef5350', kills: 0, mineralsCollected: 0 },
      ],
      ships: [ship1, ship2],
      asteroids,
      bullets: [],
      particles: [],
      canvasWidth: w,
      canvasHeight: h,
      winnerId: null,
      stats: {
        ...initialStats,
        startTime: Date.now(),
      },
    });
  },

  updateShip: (id: string, partial: Partial<Ship>) => {
    set((state) => ({
      ships: state.ships.map((ship) =>
        ship.id === id ? { ...ship, ...partial } : ship
      ),
    }));
  },

  addAsteroid: (asteroid?: Partial<Asteroid>) => {
    const { canvasWidth, canvasHeight } = get();
    const newAsteroid = createAsteroid(canvasWidth, canvasHeight, asteroid);
    set((state) => ({
      asteroids: [...state.asteroids, newAsteroid],
    }));
    return newAsteroid;
  },

  removeAsteroid: (id: string) => {
    set((state) => ({
      asteroids: state.asteroids.filter((a) => a.id !== id),
      stats: {
        ...state.stats,
        asteroidsDestroyed: state.stats.asteroidsDestroyed + 1,
      },
    }));
  },

  updateAsteroid: (id: string, partial: Partial<Asteroid>) => {
    set((state) => ({
      asteroids: state.asteroids.map((a) =>
        a.id === id ? { ...a, ...partial } : a
      ),
    }));
  },

  addBullet: (bullet?: Partial<Bullet>) => {
    const newBullet: Bullet = {
      id: uuidv4(),
      ownerId: bullet?.ownerId ?? '',
      position: bullet?.position ?? { x: 0, y: 0 },
      velocity: bullet?.velocity ?? { x: 0, y: 0 },
      damage: bullet?.damage ?? 10,
      color: bullet?.color ?? '#ffffff',
      life: bullet?.life ?? 2000,
      trail: bullet?.trail ?? [],
    };
    set((state) => ({
      bullets: [...state.bullets, newBullet],
      stats: {
        ...state.stats,
        totalBulletsFired: state.stats.totalBulletsFired + 1,
      },
    }));
    return newBullet;
  },

  removeBullet: (id: string) => {
    set((state) => ({
      bullets: state.bullets.filter((b) => b.id !== id),
    }));
  },

  updateBullet: (id: string, partial: Partial<Bullet>) => {
    set((state) => ({
      bullets: state.bullets.map((b) =>
        b.id === id ? { ...b, ...partial } : b
      ),
    }));
  },

  addParticle: (particle?: Partial<Particle>) => {
    const newParticle: Particle = {
      id: uuidv4(),
      position: particle?.position ?? { x: 0, y: 0 },
      velocity: particle?.velocity ?? { x: 0, y: 0 },
      life: particle?.life ?? 30,
      maxLife: particle?.maxLife ?? 30,
      color: particle?.color ?? '#ffffff',
      size: particle?.size ?? 3,
      type: particle?.type ?? 'explosion',
    };
    set((state) => ({
      particles: [...state.particles, newParticle],
    }));
    return newParticle;
  },

  removeParticle: (id: string) => {
    set((state) => ({
      particles: state.particles.filter((p) => p.id !== id),
    }));
  },

  updateParticle: (id: string, partial: Partial<Particle>) => {
    set((state) => ({
      particles: state.particles.map((p) =>
        p.id === id ? { ...p, ...partial } : p
      ),
    }));
  },

  damageShip: (shipId: string, damage: number) => {
    set((state) => {
      const ship = state.ships.find((s) => s.id === shipId);
      if (!ship) return state;

      let remainingDamage = damage;
      let newShieldHealth = ship.shieldHealth;
      let newHealth = ship.health;
      let newIsShieldActive = ship.isShieldActive;

      if (ship.isShieldActive && ship.shieldHealth > 0) {
        if (ship.shieldHealth >= remainingDamage) {
          newShieldHealth -= remainingDamage;
          remainingDamage = 0;
        } else {
          remainingDamage -= ship.shieldHealth;
          newShieldHealth = 0;
          newIsShieldActive = false;
        }
      }

      newHealth = Math.max(0, newHealth - remainingDamage);

      return {
        ships: state.ships.map((s) =>
          s.id === shipId
            ? {
                ...s,
                health: newHealth,
                shieldHealth: newShieldHealth,
                isShieldActive: newIsShieldActive,
              }
            : s
        ),
      };
    });
  },

  collectMinerals: (shipId: string, amount: number) => {
    set((state) => {
      const ship = state.ships.find((s) => s.id === shipId);
      if (!ship) return state;

      return {
        ships: state.ships.map((s) =>
          s.id === shipId ? { ...s, minerals: s.minerals + amount } : s
        ),
        players: state.players.map((p) =>
          p.id === ship.playerId
            ? { ...p, mineralsCollected: p.mineralsCollected + amount }
            : p
        ),
        stats: {
          ...state.stats,
          totalMineralsMined: state.stats.totalMineralsMined + amount,
        },
      };
    });
  },

  activateShield: (shipId: string) => {
    set((state) => ({
      ships: state.ships.map((s) =>
        s.id === shipId && s.shieldCooldown <= 0
          ? {
              ...s,
              isShieldActive: true,
              shieldHealth: s.shieldMax,
              shieldCooldown: 10000,
            }
          : s
      ),
    }));
  },

  startMining: (shipId: string, asteroidId: string) => {
    set((state) => ({
      ships: state.ships.map((s) =>
        s.id === shipId ? { ...s, isMining: true, miningTarget: asteroidId } : s
      ),
    }));
  },

  stopMining: (shipId: string) => {
    set((state) => ({
      ships: state.ships.map((s) =>
        s.id === shipId ? { ...s, isMining: false, miningTarget: null } : s
      ),
    }));
  },

  upgradeShip: (shipId: string, type: UpgradeType) => {
    set((state) => {
      const ship = state.ships.find((s) => s.id === shipId);
      if (!ship || ship.minerals < 50) return state;

      let updates: Partial<Ship> = { minerals: ship.minerals - 50, upgradeFlash: 60 };

      switch (type) {
        case 'speed':
          updates = { ...updates, speed: ship.speed + 0.5 };
          break;
        case 'fireRate':
          updates = { ...updates, fireRate: Math.max(100, ship.fireRate - 50) };
          break;
        case 'shield':
          updates = { ...updates, shieldMax: ship.shieldMax + 25 };
          break;
      }

      return {
        ships: state.ships.map((s) =>
          s.id === shipId ? { ...s, ...updates } : s
        ),
      };
    });
  },

  addKill: (killerId: string) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === killerId ? { ...p, kills: p.kills + 1 } : p
      ),
    }));
  },

  endGame: (winnerId: string) => {
    set({
      gameState: 'gameOver',
      winnerId,
    });
  },

  resetGame: () => {
    set({
      gameState: 'menu',
      players: [],
      ships: [],
      asteroids: [],
      bullets: [],
      particles: [],
      winnerId: null,
      stats: { ...initialStats },
    });
  },

  setCanvasSize: (w: number, h: number) => {
    set({
      canvasWidth: w,
      canvasHeight: h,
    });
  },
}));
