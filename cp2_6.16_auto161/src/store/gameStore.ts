import { create } from 'zustand';
import { GameState, BeeType, Position, Bee, Flower, Enemy, Particle, Hive, GamePhase } from '../types';
import { v4 as uuidv4 } from 'uuid';

const INITIAL_HIVE: Hive = {
  position: { x: 200, y: 300 },
  level: 1,
  maxLevel: 5,
  honey: 50,
  maxHoney: 500,
  shield: 500,
  maxShield: 500,
  beeSlots: 5,
  usedBeeSlots: 0,
  defenseTowers: 0,
  upgradeCosts: [100, 250, 500, 1000, 2000],
  glowRadius: 60,
  glowPhase: 0,
  upgradeAnimation: 0,
};

const createInitialState = (): GameState => ({
  phase: 'menu',
  wave: 0,
  waveTimer: 30,
  waveInterval: 30,
  hive: { ...INITIAL_HIVE },
  bees: [],
  flowers: [],
  enemies: [],
  particles: [],
  selectedBeeType: null,
  hoveredEntityId: null,
  hoveredEntityType: null,
  mousePosition: { x: 0, y: 0 },
  cameraZoom: 1,
  cameraOffset: { x: 0, y: 0 },
  mapSize: { width: 1200, height: 600 },
  discoveredAreas: new Set<string>(),
  lastFrameTime: 0,
  fps: 60,
});

interface GameActions {
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  gameOver: () => void;
  resetGame: () => void;
  
  addBee: (type: BeeType, position: Position) => void;
  removeBee: (id: string) => void;
  updateBee: (id: string, updates: Partial<Bee>) => void;
  setBees: (bees: Bee[]) => void;
  
  addFlower: (flower: Flower) => void;
  updateFlower: (id: string, updates: Partial<Flower>) => void;
  setFlowers: (flowers: Flower[]) => void;
  
  addEnemy: (enemy: Enemy) => void;
  removeEnemy: (id: string) => void;
  updateEnemy: (id: string, updates: Partial<Enemy>) => void;
  setEnemies: (enemies: Enemy[]) => void;
  
  addParticle: (particle: Particle) => void;
  removeParticle: (id: string) => void;
  setParticles: (particles: Particle[]) => void;
  
  updateHive: (updates: Partial<Hive>) => void;
  upgradeHive: () => boolean;
  addHoney: (amount: number) => void;
  consumeHoney: (amount: number) => boolean;
  damageHive: (amount: number) => void;
  
  setSelectedBeeType: (type: BeeType | null) => void;
  setHoveredEntity: (id: string | null, type: 'flower' | 'enemy' | null) => void;
  setMousePosition: (pos: Position) => void;
  setCameraZoom: (zoom: number) => void;
  setCameraOffset: (offset: Position) => void;
  
  setWave: (wave: number) => void;
  setWaveTimer: (timer: number) => void;
  setWaveInterval: (interval: number) => void;
  
  setPhase: (phase: GamePhase) => void;
  setFps: (fps: number) => void;
  setLastFrameTime: (time: number) => void;
  
  discoverArea: (key: string) => void;
  dispatchBee: (type: BeeType, target: Position) => boolean;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...createInitialState(),

  startGame: () => {
    const state = createInitialState();
    state.phase = 'playing';
    state.flowers = generateInitialFlowers(state.mapSize);
    state.discoveredAreas = new Set(['200,300', '250,300', '200,250', '150,300', '200,350', '250,250', '150,350', '250,350', '150,250']);
    set(state);
  },

  pauseGame: () => set({ phase: 'paused' }),
  resumeGame: () => set({ phase: 'playing' }),
  gameOver: () => set({ phase: 'gameover' }),
  resetGame: () => {
    const state = createInitialState();
    state.phase = 'playing';
    state.flowers = generateInitialFlowers(state.mapSize);
    state.discoveredAreas = new Set(['200,300', '250,300', '200,250', '150,300', '200,350', '250,250', '150,350', '250,350', '150,250']);
    set(state);
  },

  addBee: (type, position) => {
    const { hive, bees } = get();
    if (bees.length >= hive.beeSlots) return;
    
    const beeConfig = {
      collector: { health: 30, speed: 80, maxCarry: 20 },
      scout: { health: 20, speed: 120, maxCarry: 5 },
      guardian: { health: 80, speed: 60, maxCarry: 0 },
    }[type];

    const newBee: Bee = {
      id: uuidv4(),
      type,
      position: { ...position },
      targetPosition: null,
      state: 'idle',
      health: beeConfig.health,
      maxHealth: beeConfig.health,
      path: [],
      pathIndex: 0,
      speed: beeConfig.speed,
      carryHoney: 0,
      maxCarry: beeConfig.maxCarry,
      targetFlowerId: null,
      targetEnemyId: null,
      attackCooldown: 0,
      patrolAngle: Math.random() * Math.PI * 2,
    };

    set((state) => ({
      bees: [...state.bees, newBee],
      hive: { ...state.hive, usedBeeSlots: state.hive.usedBeeSlots + 1 },
    }));
  },

  removeBee: (id) => set((state) => ({
    bees: state.bees.filter((b) => b.id !== id),
    hive: { ...state.hive, usedBeeSlots: Math.max(0, state.hive.usedBeeSlots - 1) },
  })),

  updateBee: (id, updates) => set((state) => ({
    bees: state.bees.map((b) => (b.id === id ? { ...b, ...updates } : b)),
  })),

  setBees: (bees) => set({ bees }),

  addFlower: (flower) => set((state) => ({
    flowers: [...state.flowers, flower],
  })),

  updateFlower: (id, updates) => set((state) => ({
    flowers: state.flowers.map((f) => (f.id === id ? { ...f, ...updates } : f)),
  })),

  setFlowers: (flowers) => set({ flowers }),

  addEnemy: (enemy) => set((state) => ({
    enemies: [...state.enemies, enemy],
  })),

  removeEnemy: (id) => set((state) => ({
    enemies: state.enemies.filter((e) => e.id !== id),
  })),

  updateEnemy: (id, updates) => set((state) => ({
    enemies: state.enemies.map((e) => (e.id === id ? { ...e, ...updates } : e)),
  })),

  setEnemies: (enemies) => set({ enemies }),

  addParticle: (particle) => set((state) => ({
    particles: [...state.particles, particle],
  })),

  removeParticle: (id) => set((state) => ({
    particles: state.particles.filter((p) => p.id !== id),
  })),

  setParticles: (particles) => set({ particles }),

  updateHive: (updates) => set((state) => ({
    hive: { ...state.hive, ...updates },
  })),

  upgradeHive: () => {
    const { hive } = get();
    if (hive.level >= hive.maxLevel) return false;
    const cost = hive.upgradeCosts[hive.level - 1];
    if (hive.honey < cost) return false;

    set((state) => ({
      hive: {
        ...state.hive,
        honey: state.hive.honey - cost,
        level: state.hive.level + 1,
        beeSlots: state.hive.beeSlots + 3,
        maxShield: state.hive.maxShield + 200,
        shield: state.hive.maxShield + 200,
        maxHoney: state.hive.maxHoney + 300,
        glowRadius: state.hive.glowRadius + 20,
        upgradeAnimation: 0.8,
      },
    }));
    return true;
  },

  addHoney: (amount) => set((state) => ({
    hive: {
      ...state.hive,
      honey: Math.min(state.hive.maxHoney, state.hive.honey + amount),
    },
  })),

  consumeHoney: (amount) => {
    const { hive } = get();
    if (hive.honey < amount) return false;
    set((state) => ({
      hive: { ...state.hive, honey: state.hive.honey - amount },
    }));
    return true;
  },

  damageHive: (amount) => {
    const { hive, gameOver } = get();
    const newShield = hive.shield - amount;
    if (newShield <= 0) {
      set({ hive: { ...hive, shield: 0 }, phase: 'gameover' });
    } else {
      set({ hive: { ...hive, shield: newShield } });
    }
  },

  setSelectedBeeType: (type) => set({ selectedBeeType: type }),
  setHoveredEntity: (id, type) => set({ hoveredEntityId: id, hoveredEntityType: type }),
  setMousePosition: (pos) => set({ mousePosition: pos }),
  setCameraZoom: (zoom) => set({ cameraZoom: Math.max(0.5, Math.min(2.0, zoom)) }),
  setCameraOffset: (offset) => set({ cameraOffset: offset }),

  setWave: (wave) => set({ wave }),
  setWaveTimer: (timer) => set({ waveTimer: timer }),
  setWaveInterval: (interval) => set({ waveInterval: interval }),

  setPhase: (phase) => set({ phase }),
  setFps: (fps) => set({ fps }),
  setLastFrameTime: (time) => set({ lastFrameTime: time }),

  discoverArea: (key) => set((state) => {
    const newAreas = new Set(state.discoveredAreas);
    newAreas.add(key);
    return { discoveredAreas: newAreas };
  }),

  dispatchBee: (type, target) => {
    const { bees, hive, flowers, enemies } = get();
    
    const idleBee = bees.find((b) => b.type === type && (b.state === 'idle' || b.state === 'patrolling'));
    if (!idleBee) {
      if (bees.length >= hive.beeSlots) return false;
      
      const beeConfig = {
        collector: { health: 30, speed: 80, maxCarry: 20 },
        scout: { health: 20, speed: 120, maxCarry: 5 },
        guardian: { health: 80, speed: 60, maxCarry: 0 },
      }[type];

      const cost = { collector: 10, scout: 15, guardian: 25 }[type];
      if (hive.honey < cost) return false;

      const newBee: Bee = {
        id: uuidv4(),
        type,
        position: { ...hive.position },
        targetPosition: { ...target },
        state: 'moving',
        health: beeConfig.health,
        maxHealth: beeConfig.health,
        path: [],
        pathIndex: 0,
        speed: beeConfig.speed,
        carryHoney: 0,
        maxCarry: beeConfig.maxCarry,
        targetFlowerId: null,
        targetEnemyId: null,
        attackCooldown: 0,
        patrolAngle: Math.random() * Math.PI * 2,
      };

      set((state) => ({
        bees: [...state.bees, newBee],
        hive: { 
          ...state.hive, 
          usedBeeSlots: state.hive.usedBeeSlots + 1,
          honey: state.hive.honey - cost,
        },
      }));
      return true;
    }

    let targetFlowerId: string | null = null;
    let targetEnemyId: string | null = null;

    if (type === 'collector') {
      const nearestFlower = flowers.reduce<Flower | null>((nearest, flower) => {
        const dist = Math.hypot(flower.position.x - target.x, flower.position.y - target.y);
        if (dist < 60 && flower.honeyAmount > 0) {
          if (!nearest) return flower;
          const nearestDist = Math.hypot(nearest.position.x - target.x, nearest.position.y - target.y);
          return dist < nearestDist ? flower : nearest;
        }
        return nearest;
      }, null);
      if (nearestFlower) {
        targetFlowerId = nearestFlower.id;
      }
    }

    if (type === 'guardian') {
      const nearestEnemy = enemies.reduce<Enemy | null>((nearest, enemy) => {
        const dist = Math.hypot(enemy.position.x - target.x, enemy.position.y - target.y);
        if (dist < 100) {
          if (!nearest) return enemy;
          const nearestDist = Math.hypot(nearest.position.x - target.x, nearest.position.y - target.y);
          return dist < nearestDist ? enemy : nearest;
        }
        return nearest;
      }, null);
      if (nearestEnemy) {
        targetEnemyId = nearestEnemy.id;
      }
    }

    set((state) => ({
      bees: state.bees.map((b) =>
        b.id === idleBee.id
          ? {
              ...b,
              targetPosition: { ...target },
              state: 'moving',
              targetFlowerId,
              targetEnemyId,
              path: [],
              pathIndex: 0,
            }
          : b
      ),
    }));
    return true;
  },
}));

function generateInitialFlowers(mapSize: { width: number; height: number }): Flower[] {
  const flowers: Flower[] = [];
  const colors = ['#FF4500', '#FFD700', '#FF69B4', '#BA55D3'];
  
  for (let i = 0; i < 15; i++) {
    flowers.push({
      id: uuidv4(),
      position: {
        x: 400 + Math.random() * (mapSize.width - 500),
        y: 80 + Math.random() * (mapSize.height - 160),
      },
      honeyAmount: 50 + Math.floor(Math.random() * 100),
      maxHoney: 100 + Math.floor(Math.random() * 50),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      discovered: false,
    });
  }
  
  return flowers;
}
