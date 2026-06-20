import { create } from 'zustand';

export interface IceBlock {
  id: string;
  batchId: string;
  storageTime: number;
  originalSize: number;
  currentSize: number;
  location: 'storage' | 'backpack' | 'vessel';
  vesselId?: string;
  lastUpdateTime: number;
}

export interface IceVessel {
  id: string;
  type: 'large' | 'medium' | 'small';
  diameter: number;
  temperature: number;
  maxSlots: number;
  iceBlocks: string[];
}

export type Scene = 'iceStorage' | 'banquet';

interface GameState {
  currentScene: Scene;
  iceBlocks: IceBlock[];
  vessels: IceVessel[];
  backpack: string[];
  usedIceCount: number;
  totalLossRate: number;
  originalTotalIce: number;
  meltedCount: number;
  totalMeltedAmount: number;
  
  switchScene: (scene: Scene) => void;
  takeIceFromStorage: (id: string) => boolean;
  placeIceToVessel: (iceId: string, vesselId: string) => boolean;
  removeMeltedIce: (id: string) => void;
  updateIceSize: (id: string, newSize: number) => void;
  recalculateTemperatures: () => void;
  updateLossRate: () => void;
}

const generateBatchId = () => {
  const year = new Date().getFullYear();
  return `冰${year}冬${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
};

const createInitialIceBlocks = (): IceBlock[] => {
  const blocks: IceBlock[] = [];
  const now = Date.now();
  const batchId = generateBatchId();
  
  for (let i = 0; i < 30; i++) {
    blocks.push({
      id: `ice-${i}`,
      batchId,
      storageTime: now,
      originalSize: 1.0,
      currentSize: 1.0,
      location: 'storage',
      lastUpdateTime: now,
    });
  }
  return blocks;
};

const createInitialVessels = (): IceVessel[] => [
  {
    id: 'vessel-large',
    type: 'large',
    diameter: 0.6,
    temperature: 25,
    maxSlots: 8,
    iceBlocks: [],
  },
  {
    id: 'vessel-medium',
    type: 'medium',
    diameter: 0.4,
    temperature: 25,
    maxSlots: 5,
    iceBlocks: [],
  },
  {
    id: 'vessel-small',
    type: 'small',
    diameter: 0.2,
    temperature: 25,
    maxSlots: 2,
    iceBlocks: [],
  },
];

export const useGameStore = create<GameState>((set, get) => ({
  currentScene: 'iceStorage',
  iceBlocks: createInitialIceBlocks(),
  vessels: createInitialVessels(),
  backpack: [],
  usedIceCount: 0,
  totalLossRate: 0,
  originalTotalIce: 30,
  meltedCount: 0,
  totalMeltedAmount: 0,

  switchScene: (scene: Scene) => {
    set({ currentScene: scene });
  },

  takeIceFromStorage: (id: string) => {
    const state = get();
    const iceBlock = state.iceBlocks.find(b => b.id === id);
    
    if (!iceBlock || iceBlock.location !== 'storage') return false;
    if (state.backpack.length >= 10) return false;

    set(state => ({
      iceBlocks: state.iceBlocks.map(b =>
        b.id === id ? { ...b, location: 'backpack' as const, lastUpdateTime: Date.now() } : b
      ),
      backpack: [...state.backpack, id],
    }));
    
    return true;
  },

  placeIceToVessel: (iceId: string, vesselId: string) => {
    const state = get();
    const iceBlock = state.iceBlocks.find(b => b.id === iceId);
    const vessel = state.vessels.find(v => v.id === vesselId);
    
    if (!iceBlock || !vessel) return false;
    if (iceBlock.location !== 'backpack') return false;
    if (vessel.iceBlocks.length >= vessel.maxSlots) return false;

    set(state => ({
      iceBlocks: state.iceBlocks.map(b =>
        b.id === iceId ? { ...b, location: 'vessel' as const, vesselId, lastUpdateTime: Date.now() } : b
      ),
      backpack: state.backpack.filter(id => id !== iceId),
      vessels: state.vessels.map(v =>
        v.id === vesselId ? { ...v, iceBlocks: [...v.iceBlocks, iceId] } : v
      ),
      usedIceCount: state.usedIceCount + 1,
    }));

    get().recalculateTemperatures();
    return true;
  },

  removeMeltedIce: (id: string) => {
    const state = get();
    const iceBlock = state.iceBlocks.find(b => b.id === id);
    if (!iceBlock) return;

    const meltedAmount = iceBlock.originalSize;

    set(state => {
      const newState: Partial<GameState> = {
        iceBlocks: state.iceBlocks.filter(b => b.id !== id),
        meltedCount: state.meltedCount + 1,
        totalMeltedAmount: state.totalMeltedAmount + meltedAmount,
      };

      if (iceBlock.location === 'backpack') {
        newState.backpack = state.backpack.filter(bid => bid !== id);
      } else if (iceBlock.location === 'vessel' && iceBlock.vesselId) {
        newState.vessels = state.vessels.map(v =>
          v.id === iceBlock.vesselId
            ? { ...v, iceBlocks: v.iceBlocks.filter(bid => bid !== id) }
            : v
        );
      }

      return newState;
    });

    get().recalculateTemperatures();
    get().updateLossRate();
  },

  updateIceSize: (id: string, newSize: number) => {
    set(state => ({
      iceBlocks: state.iceBlocks.map(b =>
        b.id === id ? { ...b, currentSize: Math.max(0, newSize), lastUpdateTime: Date.now() } : b
      ),
    }));
    get().recalculateTemperatures();
    get().updateLossRate();
  },

  recalculateTemperatures: () => {
    set(state => ({
      vessels: state.vessels.map(vessel => {
        if (vessel.iceBlocks.length === 0) {
          return { ...vessel, temperature: 25 };
        }

        const validIceBlocks = vessel.iceBlocks
          .map(id => state.iceBlocks.find(b => b.id === id))
          .filter((b): b is IceBlock => b !== undefined);

        if (validIceBlocks.length === 0) {
          return { ...vessel, temperature: 25 };
        }

        const totalEffective = validIceBlocks.reduce((sum, b) => sum + b.currentSize, 0);
        const temperature = Math.max(0, 25 - totalEffective);

        return { ...vessel, temperature };
      }),
    }));
  },

  updateLossRate: () => {
    const state = get();
    const currentMeltedAmount = state.iceBlocks.reduce(
      (sum, b) => sum + (b.originalSize - b.currentSize),
      0
    );
    const totalLost = state.totalMeltedAmount + currentMeltedAmount;
    const lossRate = (totalLost / state.originalTotalIce) * 100;

    set({ totalLossRate: Math.round(lossRate * 10) / 10 });
  },
}));
