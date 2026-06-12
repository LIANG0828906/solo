import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  GameStore,
  Position,
  TileType,
  PartType,
  CollectedPart,
  MatchCard,
  RepairSlot,
  GameEvent,
} from './types';

const MAP_SIZE = 20;

const generateMapData = (): TileType[][] => {
  const map: TileType[][] = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    const row: TileType[] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      const rand = Math.random();
      if (rand < 0.08) {
        row.push('wreck');
      } else if (rand < 0.12) {
        row.push('trench');
      } else {
        row.push('ocean');
      }
    }
    map.push(row);
  }
  const center = Math.floor(MAP_SIZE / 2);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      map[center + dy][center + dx] = 'ocean';
    }
  }
  map[3][3] = 'wreck';
  map[16][16] = 'wreck';
  map[3][16] = 'wreck';
  map[16][3] = 'wreck';
  return map;
};

const generateFog = (): boolean[][] => {
  const fog: boolean[][] = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      row.push(true);
    }
    fog.push(row);
  }
  return fog;
};

const generateRepairSlots = (): RepairSlot[] => {
  return [
    { id: uuidv4(), region: 'hull', requiredType: 'hull_plate', filled: false, label: '船体钢板A', x: 10, y: 25 },
    { id: uuidv4(), region: 'hull', requiredType: 'hull_plate', filled: false, label: '船体钢板B', x: 60, y: 25 },
    { id: uuidv4(), region: 'hull', requiredType: 'hull_plate', filled: false, label: '船体钢板C', x: 35, y: 15 },
    { id: uuidv4(), region: 'pipeline', requiredType: 'pipe_fragment', filled: false, label: '管道碎片1', x: 20, y: 50 },
    { id: uuidv4(), region: 'pipeline', requiredType: 'pipe_fragment', filled: false, label: '管道碎片2', x: 50, y: 50 },
    { id: uuidv4(), region: 'pipeline', requiredType: 'valve', filled: false, label: '控制阀', x: 35, y: 60 },
    { id: uuidv4(), region: 'engine', requiredType: 'engine_piece', filled: false, label: '引擎核心', x: 35, y: 80 },
    { id: uuidv4(), region: 'engine', requiredType: 'circuit_board', filled: false, label: '控制电路板', x: 15, y: 80 },
    { id: uuidv4(), region: 'engine', requiredType: 'battery', filled: false, label: '能源电池', x: 55, y: 80 },
  ];
};

const PART_INFO: Record<PartType, { name: string; icon: string }> = {
  pipe_fragment: { name: '管道碎片', icon: '🔧' },
  valve: { name: '控制阀', icon: '⚙️' },
  engine_piece: { name: '引擎零件', icon: '🔩' },
  hull_plate: { name: '船体钢板', icon: '🛡️' },
  circuit_board: { name: '电路板', icon: '🔌' },
  battery: { name: '能源电池', icon: '🔋' },
};

export const getPartInfo = (type: PartType) => PART_INFO[type];

export const createPart = (type: PartType): CollectedPart => {
  const info = getPartInfo(type);
  return {
    id: uuidv4(),
    type,
    name: info.name,
    icon: info.icon,
  };
};

const initialMap = generateMapData();
const initialFog = generateFog();
const center = Math.floor(MAP_SIZE / 2);

for (let dy = -3; dy <= 3; dy++) {
  for (let dx = -3; dx <= 3; dx++) {
    const fy = center + dy;
    const fx = center + dx;
    if (fy >= 0 && fy < MAP_SIZE && fx >= 0 && fx < MAP_SIZE) {
      initialFog[fy][fx] = false;
    }
  }
}

const initialRepairSlots = generateRepairSlots();

export const useGameStore = create<GameStore>((set, get) => ({
  playerPosition: { x: center, y: center },
  stamina: 100,
  maxStamina: 100,
  gamePhase: 'exploring',
  gameView: 'map',

  mapData: initialMap,
  mapSize: MAP_SIZE,
  fog: initialFog,
  searchedWrecks: new Set(),

  collectedParts: [],
  repairSlots: initialRepairSlots,
  engineStarted: false,

  depth: 0,
  maxDepth: 200,
  oxygen: 100,
  maxOxygen: 100,
  pressure: 0,
  maxPressure: 100,
  submarineDamaged: false,

  events: [
    {
      id: uuidv4(),
      timestamp: Date.now(),
      message: '欢迎来到深海探索！你在一艘废弃的潜水艇附近苏醒，使用WASD或方向键探索周围的沉船残骸。',
      type: 'info',
    },
  ],
  turn: 0,
  isSearching: false,
  searchPosition: null,
  matchCards: [],
  matchedPairs: 0,
  totalPairs: 0,
  flippedCards: [],

  setPlayerPosition: (pos: Position) => {
    set({ playerPosition: pos });
    get().incrementTurn();
    const state = get();
    if (state.turn % 3 === 0 && state.stamina < state.maxStamina) {
      get().addStamina(1);
    }
  },

  revealFog: (x: number, y: number) => {
    set((state) => {
      const newFog = state.fog.map((row) => [...row]);
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const fy = y + dy;
          const fx = x + dx;
          if (fy >= 0 && fy < MAP_SIZE && fx >= 0 && fx < MAP_SIZE) {
            newFog[fy][fx] = false;
          }
        }
      }
      return { fog: newFog };
    });
  },

  addStamina: (amount: number) => {
    set((state) => ({
      stamina: Math.min(state.maxStamina, state.stamina + amount),
    }));
  },

  consumeStamina: (amount: number): boolean => {
    const state = get();
    if (state.stamina < amount) {
      get().addEvent(`体力不足！需要${amount}点体力，当前仅有${state.stamina}点。`, 'warning');
      return false;
    }
    set({ stamina: state.stamina - amount });
    return true;
  },

  setGamePhase: (phase) => set({ gamePhase: phase }),
  setGameView: (view) => set({ gameView: view }),

  addCollectedPart: (part: CollectedPart) => {
    set((state) => ({ collectedParts: [...state.collectedParts, part] }));
    get().addEvent(`获得部件：${part.icon} ${part.name}`, 'success');
  },

  removeCollectedPart: (partId: string) => {
    set((state) => ({
      collectedParts: state.collectedParts.filter((p) => p.id !== partId),
    }));
  },

  fillRepairSlot: (slotId: string, part: CollectedPart) => {
    set((state) => ({
      repairSlots: state.repairSlots.map((slot) =>
        slot.id === slotId ? { ...slot, filled: true, filledPart: part } : slot
      ),
    }));
    get().removeCollectedPart(part.id);
    get().addEvent(`已安装 ${part.icon} ${part.name} 到修复槽位`, 'success');
  },

  setEngineStarted: (started: boolean) => set({ engineStarted: started }),

  checkRepairComplete: (): boolean => {
    const state = get();
    return state.repairSlots.every((slot) => slot.filled);
  },

  setDepth: (depth: number) => {
    const clamped = Math.max(0, Math.min(get().maxDepth, depth));
    set({ depth: clamped });
    if (clamped >= get().maxDepth) {
      get().addEvent('🎉 恭喜！你已到达海沟最深处，探索任务完成！', 'success');
      set({ gamePhase: 'victory' });
    }
  },

  consumeOxygen: (amount: number) => {
    set((state) => {
      const newOxygen = Math.max(0, state.oxygen - amount);
      if (newOxygen <= 0) {
        get().addEvent('⚠️ 氧气耗尽！任务失败。', 'danger');
        set({ gamePhase: 'gameover', submarineDamaged: true });
      }
      return { oxygen: newOxygen };
    });
  },

  setPressure: (pressure: number) => {
    const clamped = Math.max(0, Math.min(get().maxPressure, pressure));
    set({ pressure: clamped });
    if (clamped >= get().maxPressure) {
      get().addEvent('💥 压力超过极限！潜艇损坏，任务失败。', 'danger');
      set({ gamePhase: 'gameover', submarineDamaged: true });
    }
  },

  setSubmarineDamaged: (damaged) => set({ submarineDamaged: damaged }),

  addEvent: (message: string, type: GameEvent['type'] = 'info') => {
    const event: GameEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      message,
      type,
    };
    set((state) => ({
      events: [event, ...state.events].slice(0, 50),
    }));
  },

  incrementTurn: () => set((state) => ({ turn: state.turn + 1 })),

  markWreckSearched: (x: number, y: number) => {
    set((state) => {
      const newSet = new Set(state.searchedWrecks);
      newSet.add(`${x},${y}`);
      return { searchedWrecks: newSet };
    });
  },

  isWreckSearched: (x: number, y: number): boolean => {
    return get().searchedWrecks.has(`${x},${y}`);
  },

  startSearch: (pos: Position) => {
    const partTypes: PartType[] = ['pipe_fragment', 'valve', 'engine_piece', 'hull_plate', 'circuit_board', 'battery'];
    const shuffled = partTypes.sort(() => Math.random() - 0.5).slice(0, 4);
    const pairs = [...shuffled, ...shuffled];
    const cards: MatchCard[] = pairs
      .sort(() => Math.random() - 0.5)
      .map((type) => {
        const info = getPartInfo(type);
        return {
          id: uuidv4(),
          partType: type,
          icon: info.icon,
          name: info.name,
          matched: false,
        };
      });

    set({
      isSearching: true,
      searchPosition: pos,
      matchCards: cards,
      matchedPairs: 0,
      totalPairs: 4,
      flippedCards: [],
    });
    get().addEvent('开始搜索沉船残骸...', 'info');
  },

  endSearch: () => {
    const state = get();
    if (state.searchPosition) {
      get().markWreckSearched(state.searchPosition.x, state.searchPosition.y);
    }
    set({
      isSearching: false,
      searchPosition: null,
      matchCards: [],
      matchedPairs: 0,
      totalPairs: 0,
      flippedCards: [],
    });
  },

  setMatchCards: (cards: MatchCard[]) => set({ matchCards: cards }),

  flipCard: (cardId: string) => {
    const state = get();
    if (state.flippedCards.length >= 2) return;
    if (state.flippedCards.includes(cardId)) return;
    const card = state.matchCards.find((c) => c.id === cardId);
    if (!card || card.matched) return;

    set((s) => ({ flippedCards: [...s.flippedCards, cardId] }));
  },

  resetFlippedCards: () => set({ flippedCards: [] }),

  incrementMatchedPairs: () => {
    set((state) => {
      const newMatched = state.matchedPairs + 1;
      return { matchedPairs: newMatched };
    });
  },
}));
