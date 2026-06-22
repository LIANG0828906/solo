import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { GameState, Mineral, MineralType, Meteor, MeteorEvent, Resources, Shockwave, MineralUnlock } from './types';

const createInitialResources = (): Resources => ({
  surface: 0,
  mid: 0,
  deep: 0,
  total: 0
});

const createInitialMineralUnlocks = (): MineralUnlock => ({
  surface: true,
  mid: false,
  deep: false
});

const createInitialMeteorEvent = (): MeteorEvent => ({
  active: false,
  warningPhase: false,
  warningStartTime: 0,
  shakeFrames: 0,
  meteors: []
});

const generateRandomNextMeteorTime = (currentTime: number): number => {
  const minDelay = 45000;
  const maxDelay = 90000;
  return currentTime + minDelay + Math.random() * (maxDelay - minDelay);
};

export const createMineral = (type: MineralType, canvasWidth: number, canvasHeight: number): Mineral => {
  const layers = {
    [MineralType.Surface]: { minY: 0.65, maxY: 0.9, size: 18, speed: 0.3 },
    [MineralType.Mid]: { minY: 0.4, maxY: 0.7, size: 22, speed: 0.22 },
    [MineralType.Deep]: { minY: 0.15, maxY: 0.45, size: 26, speed: 0.15 }
  };
  const layer = layers[type];
  const y = canvasHeight * (layer.minY + Math.random() * (layer.maxY - layer.minY));
  
  return {
    id: uuidv4(),
    type,
    x: 40 + Math.random() * (canvasWidth - 80),
    y,
    vx: (Math.random() - 0.5) * 0.15,
    vy: -layer.speed * (0.8 + Math.random() * 0.4),
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.03,
    size: layer.size * (0.85 + Math.random() * 0.3),
    trail: []
  };
};

const createInitialMinerals = (canvasWidth: number, canvasHeight: number, unlocks: MineralUnlock): Mineral[] => {
  const minerals: Mineral[] = [];
  if (unlocks.surface) {
    for (let i = 0; i < 5; i++) {
      minerals.push(createMineral(MineralType.Surface, canvasWidth, canvasHeight));
    }
  }
  if (unlocks.mid) {
    for (let i = 0; i < 3; i++) {
      minerals.push(createMineral(MineralType.Mid, canvasWidth, canvasHeight));
    }
  }
  if (unlocks.deep) {
    for (let i = 0; i < 2; i++) {
      minerals.push(createMineral(MineralType.Deep, canvasWidth, canvasHeight));
    }
  }
  return minerals;
};

interface GameStore extends GameState {
  canvasWidth: number;
  canvasHeight: number;
  setCanvasSize: (width: number, height: number) => void;
  initializeMinerals: () => void;
  addMineral: (mineral: Mineral) => void;
  removeMineral: (id: string) => void;
  updateMinerals: (minerals: Mineral[]) => void;
  addResource: (type: MineralType, amount: number) => void;
  setAutoMineRate: (rate: number) => void;
  addShockwave: (shockwave: Shockwave) => void;
  removeShockwave: (id: string) => void;
  updateShockwaves: (shockwaves: Shockwave[]) => void;
  setMeteorEvent: (event: Partial<MeteorEvent>) => void;
  addMeteor: (meteor: Meteor) => void;
  removeMeteor: (id: string) => void;
  updateMeteors: (meteors: Meteor[]) => void;
  setProductionPaused: (paused: boolean, until?: number) => void;
  setRecoveryStartTime: (time: number) => void;
  setNextMeteorTime: (time: number) => void;
  unlockMineral: (type: MineralType) => void;
  upgradeClickPower: () => boolean;
  upgradeAutoMine: () => boolean;
  resetShakeFrames: () => void;
  decrementShakeFrames: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  resources: createInitialResources(),
  minerals: [],
  autoMineRate: 1,
  autoMineLevel: 1,
  meteorEvent: createInitialMeteorEvent(),
  shockwaves: [],
  productionPaused: false,
  productionPausedUntil: 0,
  recoveryStartTime: 0,
  nextMeteorTime: generateRandomNextMeteorTime(Date.now()),
  mineralUnlocks: createInitialMineralUnlocks(),
  upgrades: {
    clickPower: 1,
    autoMine: 1
  },
  canvasWidth: 800,
  canvasHeight: 600,

  setCanvasSize: (width, height) => set({ canvasWidth: width, canvasHeight: height }),

  initializeMinerals: () => {
    const { canvasWidth, canvasHeight, mineralUnlocks } = get();
    set({ minerals: createInitialMinerals(canvasWidth, canvasHeight, mineralUnlocks) });
  },

  addMineral: (mineral) => set((state) => ({ minerals: [...state.minerals, mineral] })),

  removeMineral: (id) => set((state) => ({
    minerals: state.minerals.filter(m => m.id !== id)
  })),

  updateMinerals: (minerals) => set({ minerals }),

  addResource: (type, amount) => set((state) => {
    const newResources = { ...state.resources };
    newResources[type] += amount;
    newResources.total += amount;
    return { resources: newResources };
  }),

  setAutoMineRate: (rate) => set({ autoMineRate: rate }),

  addShockwave: (shockwave) => set((state) => ({
    shockwaves: [...state.shockwaves, shockwave]
  })),

  removeShockwave: (id) => set((state) => ({
    shockwaves: state.shockwaves.filter(s => s.id !== id)
  })),

  updateShockwaves: (shockwaves) => set({ shockwaves }),

  setMeteorEvent: (event) => set((state) => ({
    meteorEvent: { ...state.meteorEvent, ...event }
  })),

  addMeteor: (meteor) => set((state) => ({
    meteorEvent: {
      ...state.meteorEvent,
      meteors: [...state.meteorEvent.meteors, meteor]
    }
  })),

  removeMeteor: (id) => set((state) => ({
    meteorEvent: {
      ...state.meteorEvent,
      meteors: state.meteorEvent.meteors.filter(m => m.id !== id)
    }
  })),

  updateMeteors: (meteors) => set((state) => ({
    meteorEvent: { ...state.meteorEvent, meteors }
  })),

  setProductionPaused: (paused, until) => set({
    productionPaused: paused,
    productionPausedUntil: until ?? 0
  }),

  setRecoveryStartTime: (time) => set({ recoveryStartTime: time }),

  setNextMeteorTime: (time) => set({ nextMeteorTime: time }),

  unlockMineral: (type) => set((state) => ({
    mineralUnlocks: { ...state.mineralUnlocks, [type]: true }
  })),

  upgradeClickPower: () => {
    const state = get();
    const cost = Math.floor(10 * Math.pow(1.8, state.upgrades.clickPower - 1));
    if (state.resources.total >= cost) {
      set((s) => ({
        resources: { ...s.resources, total: s.resources.total - cost },
        upgrades: { ...s.upgrades, clickPower: s.upgrades.clickPower + 1 }
      }));
      return true;
    }
    return false;
  },

  upgradeAutoMine: () => {
    const state = get();
    const cost = Math.floor(25 * Math.pow(2, state.upgrades.autoMine - 1));
    if (state.resources.total >= cost) {
      set((s) => ({
        resources: { ...s.resources, total: s.resources.total - cost },
        upgrades: { ...s.upgrades, autoMine: s.upgrades.autoMine + 1 },
        autoMineLevel: s.autoMineLevel + 1
      }));
      return true;
    }
    return false;
  },

  resetShakeFrames: () => set((state) => ({
    meteorEvent: { ...state.meteorEvent, shakeFrames: 2 }
  })),

  decrementShakeFrames: () => set((state) => ({
    meteorEvent: { ...state.meteorEvent, shakeFrames: Math.max(0, state.meteorEvent.shakeFrames - 1) }
  }))
}));

export const formatNumber = (num: number): string => {
  if (num < 1000) return Math.floor(num).toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'k';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  return (num / 1000000000).toFixed(1) + 'B';
};

export const getMineralValue = (type: MineralType): number => {
  const values = {
    [MineralType.Surface]: 1,
    [MineralType.Mid]: 5,
    [MineralType.Deep]: 20
  };
  return values[type];
};

export const getMineralColor = (type: MineralType): string => {
  const colors = {
    [MineralType.Surface]: '#7B68EE',
    [MineralType.Mid]: '#00CED1',
    [MineralType.Deep]: '#FFD700'
  };
  return colors[type];
};

export const getMineralName = (type: MineralType): string => {
  const names = {
    [MineralType.Surface]: '星尘矿',
    [MineralType.Mid]: '虚空晶',
    [MineralType.Deep]: '宇宙核'
  };
  return names[type];
};

export const getUpgradeCost = (level: number, base: number, multiplier: number): number => {
  return Math.floor(base * Math.pow(multiplier, level - 1));
};
