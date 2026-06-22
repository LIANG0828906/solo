import { create } from 'zustand';
import type { Enemy, DungeonRoom, PlayerPosition, GameView, SeedType, FarmCell, Seed, CropState } from '@/types';
import { getSeedColor, getCropValue } from '@/utils/pixel';

const GRID_SIZE = 9;

interface GameState {
  coins: number;
  gold: number;
  hp: number;
  maxHp: number;
  view: GameView;
  currentView: GameView;
  playerPosition: PlayerPosition;
  dungeon: DungeonRoom[][];
  currentEnemy: Enemy | null;
  seeds: Record<SeedType, number>;
  seedInventory: (Seed | null)[];
  selectedSeedIndex: number | null;
  dungeonFloor: number;
  dungeonLevel: number;
  harvestCount: number;
  farmGrid: FarmCell[][];
  setView: (view: GameView) => void;
  setCurrentView: (view: GameView) => void;
  movePlayer: (x: number, y: number) => void;
  enterRoom: (x: number, y: number) => void;
  setCurrentEnemy: (enemy: Enemy | null) => void;
  takeDamage: (amount: number) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => void;
  addSeed: (type: SeedType, amount: number) => void;
  resetDungeon: () => void;
  clearRoom: (x: number, y: number) => void;
  selectSeed: (index: number | null) => void;
  plantSeed: (x: number, y: number) => void;
  harvestCrop: (x: number, y: number) => void;
  updateCropGrowth: () => void;
}

const generateFarmGrid = (): FarmCell[][] => {
  const grid: FarmCell[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[y][x] = {
        state: 'empty',
        seedType: null,
        plantedAt: 0,
      };
    }
  }
  return grid;
};

const generateDungeon = (): DungeonRoom[][] => {
  const rooms: DungeonRoom[][] = [];
  for (let y = 0; y < 3; y++) {
    rooms[y] = [];
    for (let x = 0; x < 3; x++) {
      let type: DungeonRoom['type'] = 'empty';
      if (x === 0 && y === 0) {
        type = 'start';
      } else {
        const rand = Math.random();
        if (rand < 0.5) type = 'enemy';
        else if (rand < 0.7) type = 'chest';
        else type = 'empty';
      }
      rooms[y][x] = {
        type,
        visited: x === 0 && y === 0,
        cleared: x === 0 && y === 0,
      };
    }
  }
  return rooms;
};

const generateEnemy = (floor: number): Enemy => {
  const colors = ['#32CD32', '#228B22', '#006400', '#004d00', '#003300'];
  const colorIndex = Math.min(floor - 1, colors.length - 1);
  const baseHp = 3 + Math.floor(floor / 2);
  return {
    type: 'slime',
    hp: baseHp,
    maxHp: baseHp,
    attack: 1,
    color: colors[colorIndex],
  };
};

const createSeed = (type: SeedType, count: number): Seed => {
  const names: Record<SeedType, string> = {
    normal: '普通种子',
    rare: '稀有种子',
    magic: '魔法种子',
  };
  return {
    type,
    count,
    value: getCropValue(type),
    color: getSeedColor(type),
    name: names[type],
  };
};

const buildSeedInventory = (seeds: Record<SeedType, number>): (Seed | null)[] => {
  const inventory: (Seed | null)[] = [];
  const types: SeedType[] = ['normal', 'rare', 'magic'];
  for (const type of types) {
    if (seeds[type] > 0) {
      inventory.push(createSeed(type, seeds[type]));
    }
  }
  while (inventory.length < 10) {
    inventory.push(null);
  }
  return inventory;
};

const getGrowthTime = (type: SeedType): number => {
  const times: Record<SeedType, number> = {
    normal: 3000,
    rare: 5000,
    magic: 8000,
  };
  return times[type];
};

export const useGameStore = create<GameState>((set, get) => ({
  coins: 0,
  gold: 0,
  hp: 10,
  maxHp: 10,
  view: 'farm',
  currentView: 'farm',
  playerPosition: { x: 0, y: 0 },
  dungeon: generateDungeon(),
  currentEnemy: null,
  seeds: { normal: 5, rare: 2, magic: 1 },
  seedInventory: buildSeedInventory({ normal: 5, rare: 2, magic: 1 }),
  selectedSeedIndex: null,
  dungeonFloor: 1,
  dungeonLevel: 1,
  harvestCount: 0,
  farmGrid: generateFarmGrid(),

  setView: (view) => set({ view, currentView: view }),
  setCurrentView: (view) => set({ view, currentView: view }),

  movePlayer: (x, y) => {
    const { playerPosition, dungeon, setCurrentEnemy, view } = get();
    if (view !== 'dungeon') return;

    const newX = playerPosition.x + x;
    const newY = playerPosition.y + y;

    if (newX < 0 || newX > 2 || newY < 0 || newY > 2) return;

    const targetRoom = dungeon[newY][newX];
    const currentRoom = dungeon[playerPosition.y][playerPosition.x];

    if (currentRoom.type === 'enemy' && !currentRoom.cleared) return;

    set({ playerPosition: { x: newX, y: newY } });

    if (!targetRoom.visited) {
      const newDungeon = [...dungeon];
      newDungeon[newY] = [...newDungeon[newY]];
      newDungeon[newY][newX] = { ...targetRoom, visited: true };
      set({ dungeon: newDungeon });

      if (targetRoom.type === 'enemy') {
        const enemy = generateEnemy(get().dungeonFloor);
        setCurrentEnemy(enemy);
        set({ view: 'battle', currentView: 'battle' });
      } else if (targetRoom.type === 'chest') {
        const rand = Math.random();
        let seedType: SeedType = 'normal';
        if (rand < 0.1) seedType = 'magic';
        else if (rand < 0.4) seedType = 'rare';

        get().addSeed(seedType, 1);

        const clearedDungeon = [...newDungeon];
        clearedDungeon[newY] = [...clearedDungeon[newY]];
        clearedDungeon[newY][newX] = { ...clearedDungeon[newY][newX], cleared: true };
        set({ dungeon: clearedDungeon });
      }
    }
  },

  enterRoom: (x, y) => {
    const { dungeon } = get();
    const room = dungeon[y][x];

    if (room.type === 'enemy' && !room.cleared) {
      const enemy = generateEnemy(get().dungeonFloor);
      set({ currentEnemy: enemy, view: 'battle', currentView: 'battle' });
    }
  },

  setCurrentEnemy: (enemy) => set({ currentEnemy: enemy }),

  takeDamage: (amount) => {
    const { hp, coins } = get();
    const newHp = hp - amount;
    if (newHp <= 0) {
      set({ hp: get().maxHp, coins: Math.floor(coins / 2), gold: Math.floor(coins / 2), view: 'farm', currentView: 'farm' });
    } else {
      set({ hp: newHp });
    }
  },

  addCoins: (amount) => set((state) => ({ coins: state.coins + amount, gold: state.coins + amount })),

  spendCoins: (amount) => set((state) => ({ coins: Math.max(0, state.coins - amount), gold: Math.max(0, state.coins - amount) })),

  addSeed: (type, amount) => set((state) => {
    const newSeeds = { ...state.seeds, [type]: state.seeds[type] + amount };
    return {
      seeds: newSeeds,
      seedInventory: buildSeedInventory(newSeeds),
    };
  }),

  resetDungeon: () => set({
    playerPosition: { x: 0, y: 0 },
    dungeon: generateDungeon(),
    currentEnemy: null,
    dungeonFloor: 1,
    dungeonLevel: 1,
  }),

  clearRoom: (x, y) => set((state) => {
    const newDungeon = [...state.dungeon];
    newDungeon[y] = [...newDungeon[y]];
    newDungeon[y][x] = { ...newDungeon[y][x], cleared: true };
    return { dungeon: newDungeon };
  }),

  selectSeed: (index) => set({ selectedSeedIndex: index }),

  plantSeed: (x, y) => {
    const { farmGrid, seeds, selectedSeedIndex, seedInventory } = get();
    if (selectedSeedIndex === null) return;

    const seed = seedInventory[selectedSeedIndex];
    if (!seed || seed.count <= 0) return;
    if (farmGrid[y][x].state !== 'empty') return;

    const seedType = seed.type;
    if (seeds[seedType] <= 0) return;

    const newSeeds = { ...seeds, [seedType]: seeds[seedType] - 1 };
    const newGrid = [...farmGrid];
    newGrid[y] = [...newGrid[y]];
    newGrid[y][x] = {
      state: 'sprout',
      seedType,
      plantedAt: Date.now(),
    };

    set({
      seeds: newSeeds,
      seedInventory: buildSeedInventory(newSeeds),
      farmGrid: newGrid,
      selectedSeedIndex: newSeeds[seedType] > 0 ? selectedSeedIndex : null,
    });
  },

  harvestCrop: (x, y) => {
    const { farmGrid, addCoins } = get();
    const cell = farmGrid[y][x];

    if (cell.state !== 'mature' || !cell.seedType) return;

    const value = getCropValue(cell.seedType);
    addCoins(value);

    const newGrid = [...farmGrid];
    newGrid[y] = [...newGrid[y]];
    newGrid[y][x] = {
      state: 'empty',
      seedType: null,
      plantedAt: 0,
    };

    set((state) => ({
      farmGrid: newGrid,
      harvestCount: state.harvestCount + 1,
    }));
  },

  updateCropGrowth: () => {
    const { farmGrid } = get();
    const now = Date.now();
    let hasChanges = false;

    const newGrid = farmGrid.map((row) =>
      row.map((cell) => {
        if (cell.state === 'empty' || cell.state === 'mature' || !cell.seedType) {
          return cell;
        }

        const growthTime = getGrowthTime(cell.seedType);
        const elapsed = now - cell.plantedAt;

        let newState: CropState = cell.state;
        if (elapsed >= growthTime) {
          newState = 'mature';
        } else if (elapsed >= growthTime * 0.5 && cell.state === 'sprout') {
          newState = 'growing';
        }

        if (newState !== cell.state) {
          hasChanges = true;
          return { ...cell, state: newState };
        }
        return cell;
      })
    );

    if (hasChanges) {
      set({ farmGrid: newGrid });
    }
  },
}));
