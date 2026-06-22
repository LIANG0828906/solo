import { create } from 'zustand';
import type {
  SeedType,
  Seed,
  FarmCell,
  DungeonRoom,
  PlayerPosition,
  Enemy,
  GameView,
  RoomType,
} from '../types';
import { shuffleArray, randomInt } from '../utils/random';

type BattlePhase = 'idle' | 'playerAttack' | 'enemyAttack' | 'victory' | 'defeat';

interface GameState {
  gold: number;
  hp: number;
  maxHp: number;
  dungeonFloor: number;
  harvestedCount: number;
  currentView: GameView;
  selectedSeed: SeedType | null;
  seeds: Seed[];
  farmGrid: FarmCell[][];
  dungeonGrid: DungeonRoom[][];
  playerPos: PlayerPosition;
  currentEnemy: Enemy | null;
  battlePhase: BattlePhase;
}

interface GameActions {
  selectSeed: (type: SeedType | null) => void;
  plantSeed: (row: number, col: number) => boolean;
  harvestCrop: (row: number, col: number) => { gold: number; seedType: SeedType } | null;
  takeDamage: (amount: number) => void;
  addGold: (amount: number) => void;
  setView: (view: GameView) => void;
  enterDungeon: () => void;
  exitDungeon: (victory: boolean) => void;
  generateDungeon: () => void;
  movePlayer: (dx: number, dy: number) => boolean;
  triggerRoomEvent: () => void;
  startBattle: () => void;
  playerAttack: () => void;
  enemyAttack: () => void;
  endBattle: (victory: boolean) => void;
  addSeed: (type: SeedType, count: number) => void;
  updateCropGrowth: () => void;
}

const createEmptyFarmGrid = (): FarmCell[][] => {
  return Array(9)
    .fill(null)
    .map(() =>
      Array(9)
        .fill(null)
        .map(() => ({
          state: 'empty' as const,
          seedType: null,
          plantedAt: 0,
        }))
    );
};

const createEmptyDungeonGrid = (): DungeonRoom[][] => {
  return Array(3)
    .fill(null)
    .map(() =>
      Array(3)
        .fill(null)
        .map(() => ({
          type: 'empty' as const,
          visited: false,
          cleared: false,
        }))
    );
};

const initialSeeds: Seed[] = [
  { type: 'normal', count: 5, value: 1, color: '#228B22', name: '普通种子' },
  { type: 'rare', count: 5, value: 2, color: '#4169E1', name: '稀有种子' },
  { type: 'magic', count: 5, value: 3, color: '#9932CC', name: '魔法种子' },
];

const initialState: GameState = {
  gold: 50,
  hp: 10,
  maxHp: 10,
  dungeonFloor: 1,
  harvestedCount: 0,
  currentView: 'farm',
  selectedSeed: null,
  seeds: initialSeeds,
  farmGrid: createEmptyFarmGrid(),
  dungeonGrid: createEmptyDungeonGrid(),
  playerPos: { x: 0, y: 0 },
  currentEnemy: null,
  battlePhase: 'idle',
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  selectSeed: (type: SeedType | null) => {
    set({ selectedSeed: type });
  },

  plantSeed: (row: number, col: number): boolean => {
    const state = get();
    const { selectedSeed, seeds, farmGrid } = state;

    if (!selectedSeed) return false;

    const seedIndex = seeds.findIndex((s) => s.type === selectedSeed);
    if (seedIndex === -1 || seeds[seedIndex].count <= 0) return false;

    const cell = farmGrid[row]?.[col];
    if (!cell || cell.state !== 'empty') return false;

    const newSeeds = [...seeds];
    newSeeds[seedIndex] = {
      ...newSeeds[seedIndex],
      count: newSeeds[seedIndex].count - 1,
    };

    const newFarmGrid = farmGrid.map((r, ri) =>
      r.map((c, ci) =>
        ri === row && ci === col
          ? { ...c, state: 'sprout' as const, seedType: selectedSeed, plantedAt: Date.now() }
          : c
      )
    );

    set({ seeds: newSeeds, farmGrid: newFarmGrid });
    return true;
  },

  harvestCrop: (row: number, col: number): { gold: number; seedType: SeedType } | null => {
    const state = get();
    const { farmGrid } = state;
    const cell = farmGrid[row]?.[col];

    if (!cell || cell.state !== 'mature' || !cell.seedType) return null;

    const seed = get().seeds.find((s) => s.type === cell.seedType);
    const goldEarned = seed ? randomInt(seed.value, seed.value * 3) : 1;

    const newFarmGrid = farmGrid.map((r, ri) =>
      r.map((c, ci) =>
        ri === row && ci === col
          ? { ...c, state: 'empty' as const, seedType: null, plantedAt: 0 }
          : c
      )
    );

    set((prev) => ({
      farmGrid: newFarmGrid,
      gold: prev.gold + goldEarned,
      harvestedCount: prev.harvestedCount + 1,
    }));

    return { gold: goldEarned, seedType: cell.seedType };
  },

  takeDamage: (amount: number) => {
    set((prev) => ({
      hp: Math.max(0, prev.hp - amount),
    }));
  },

  addGold: (amount: number) => {
    set((prev) => ({
      gold: prev.gold + amount,
    }));
  },

  setView: (view: GameView) => {
    set({ currentView: view });
  },

  enterDungeon: () => {
    const state = get();
    state.generateDungeon();
    set({ playerPos: { x: 0, y: 0 }, currentView: 'dungeon' });
  },

  exitDungeon: (victory: boolean) => {
    set((prev) => {
      const newGold = victory ? prev.gold : Math.floor(prev.gold / 2);
      return {
        gold: newGold,
        currentView: 'farm',
        dungeonFloor: victory ? prev.dungeonFloor + 1 : prev.dungeonFloor,
      };
    });
  },

  generateDungeon: () => {
    const roomTypes: RoomType[] = [
      'enemy', 'enemy', 'enemy', 'enemy', 'enemy',
      'chest', 'chest', 'chest',
      'empty', 'empty',
    ];

    const shuffled = shuffleArray(roomTypes);

    const newDungeonGrid: DungeonRoom[][] = [];
    let index = 0;

    for (let row = 0; row < 3; row++) {
      const gridRow: DungeonRoom[] = [];
      for (let col = 0; col < 3; col++) {
        if (row === 0 && col === 0) {
          gridRow.push({ type: 'start', visited: true, cleared: true });
        } else {
          gridRow.push({ type: shuffled[index], visited: false, cleared: false });
          index++;
        }
      }
      newDungeonGrid.push(gridRow);
    }

    set({ dungeonGrid: newDungeonGrid });
  },

  movePlayer: (dx: number, dy: number): boolean => {
    const state = get();
    const { playerPos, dungeonGrid } = state;
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    if (newX < 0 || newX >= 3 || newY < 0 || newY >= 3) return false;

    const newPos = { x: newX, y: newY };

    const newDungeonGrid = dungeonGrid.map((r, ri) =>
      r.map((c, ci) =>
        ri === newY && ci === newX ? { ...c, visited: true } : c
      )
    );

    set({ playerPos: newPos, dungeonGrid: newDungeonGrid });
    return true;
  },

  triggerRoomEvent: () => {
    const state = get();
    const { playerPos, dungeonGrid } = state;
    const room = dungeonGrid[playerPos.y]?.[playerPos.x];

    if (!room || room.cleared) return;

    if (room.type === 'enemy') {
      state.startBattle();
    } else if (room.type === 'chest') {
      const seedTypes: SeedType[] = ['normal', 'rare', 'magic'];
      const randomSeedType = seedTypes[randomInt(0, 2)];
      state.addSeed(randomSeedType, 1);

      const newDungeonGrid = dungeonGrid.map((r, ri) =>
        r.map((c, ci) =>
          ri === playerPos.y && ci === playerPos.x ? { ...c, cleared: true } : c
        )
      );
      set({ dungeonGrid: newDungeonGrid });
    } else {
      const newDungeonGrid = dungeonGrid.map((r, ri) =>
        r.map((c, ci) =>
          ri === playerPos.y && ci === playerPos.x ? { ...c, cleared: true } : c
        )
      );
      set({ dungeonGrid: newDungeonGrid });
    }
  },

  startBattle: () => {
    const state = get();
    const { dungeonFloor } = state;

    const enemyColors = ['#32CD32', '#FF4500', '#FF6347', '#9370DB', '#20B2AA'];
    const colorIndex = (dungeonFloor - 1) % enemyColors.length;

    const enemy: Enemy = {
      type: `史莱姆 Lv.${dungeonFloor}`,
      hp: 3 + dungeonFloor,
      maxHp: 3 + dungeonFloor,
      attack: 1,
      color: enemyColors[colorIndex],
    };

    set({ currentEnemy: enemy, battlePhase: 'playerAttack', currentView: 'battle' });
  },

  playerAttack: () => {
    const state = get();
    const { currentEnemy } = state;

    if (!currentEnemy || state.battlePhase !== 'playerAttack') return;

    const newHp = currentEnemy.hp - 1;

    if (newHp <= 0) {
      set({
        currentEnemy: { ...currentEnemy, hp: 0 },
        battlePhase: 'victory',
      });
    } else {
      set({
        currentEnemy: { ...currentEnemy, hp: newHp },
        battlePhase: 'enemyAttack',
      });
    }
  },

  enemyAttack: () => {
    const state = get();
    const { currentEnemy, hp } = state;

    if (!currentEnemy || state.battlePhase !== 'enemyAttack') return;

    const newHp = hp - currentEnemy.attack;

    if (newHp <= 0) {
      set({ hp: 0, battlePhase: 'defeat' });
    } else {
      set({ hp: newHp, battlePhase: 'playerAttack' });
    }
  },

  endBattle: (victory: boolean) => {
    const state = get();
    const { playerPos, dungeonGrid } = state;

    const newDungeonGrid = dungeonGrid.map((r, ri) =>
      r.map((c, ci) =>
        ri === playerPos.y && ci === playerPos.x ? { ...c, cleared: true } : c
      )
    );

    if (victory) {
      set((prev) => ({
        gold: prev.gold + 2,
        currentEnemy: null,
        battlePhase: 'idle',
        currentView: 'dungeon',
        dungeonGrid: newDungeonGrid,
      }));
    } else {
      set({
        currentEnemy: null,
        battlePhase: 'idle',
        dungeonGrid: newDungeonGrid,
      });
      state.exitDungeon(false);
    }
  },

  addSeed: (type: SeedType, count: number) => {
    set((prev) => {
      const newSeeds = prev.seeds.map((s) =>
        s.type === type ? { ...s, count: s.count + count } : s
      );
      return { seeds: newSeeds };
    });
  },

  updateCropGrowth: () => {
    const now = Date.now();
    const GROW_TIME = 1000;

    set((prev) => {
      const newFarmGrid = prev.farmGrid.map((row) =>
        row.map((cell) => {
          if (cell.state === 'empty' || cell.state === 'mature' || cell.plantedAt === 0) {
            return cell;
          }

          const elapsed = now - cell.plantedAt;

          if (cell.state === 'sprout' && elapsed >= GROW_TIME) {
            return { ...cell, state: 'growing' as const, plantedAt: now };
          }
          if (cell.state === 'growing' && elapsed >= GROW_TIME) {
            return { ...cell, state: 'mature' as const };
          }

          return cell;
        })
      );

      return { farmGrid: newFarmGrid };
    });
  },
}));
