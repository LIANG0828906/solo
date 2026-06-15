import { create } from 'zustand';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { ALL_ITEMS, RECIPES, type Item, type Recipe } from '@/data/recipes';
import { findMatchingRecipe, type GridCell } from '@/utils/patternMatcher';

export interface InventorySlot {
  itemId: string | null;
  count: number;
}

export interface CraftingCell {
  itemId: string | null;
  id: string;
}

export interface Achievement {
  id: string;
  itemId: string;
  timestamp: number;
}

export interface FlyingResource {
  id: string;
  itemId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  count: number;
}

interface GameState {
  inventory: InventorySlot[];
  inventorySize: number;
  craftingGrid: CraftingCell[][];
  recipes: Recipe[];
  items: Record<string, Item>;
  unlockedItems: Set<string>;
  isCollecting: boolean;
  collectProgress: number;
  cooldownRemaining: number;
  achievements: Achievement[];
  currentAchievement: Achievement | null;
  matchedRecipe: Recipe | null;
  isCrafting: boolean;
  flyingResources: FlyingResource[];
  
  initGame: () => Promise<void>;
  saveGame: () => Promise<void>;
  
  startDrag: (fromType: 'inventory' | 'crafting', index: number, row?: number, col?: number) => void;
  placeItem: (toType: 'inventory' | 'crafting', index: number, row?: number, col?: number) => void;
  
  addToInventory: (itemId: string, count: number) => boolean;
  removeFromInventory: (itemId: string, count: number) => boolean;
  canAddToInventory: (itemId: string, count: number) => boolean;
  isInventoryFull: () => boolean;
  
  checkRecipeMatch: () => void;
  performCraft: () => boolean;
  clearCraftingGrid: () => void;
  returnCraftingItems: () => void;
  addToCraftingGrid: (row: number, col: number, itemId: string) => boolean;
  removeFromCraftingGrid: (row: number, col: number) => string | null;
  swapCraftingCells: (row1: number, col1: number, row2: number, col2: number) => void;
  
  startCollecting: () => void;
  updateCollectProgress: (progress: number) => void;
  finishCollecting: () => void;
  setCooldown: (seconds: number) => void;
  updateCooldown: (delta: number) => void;
  
  addFlyingResource: (resource: Omit<FlyingResource, 'id'>) => void;
  removeFlyingResource: (id: string) => void;
  
  showAchievement: (itemId: string) => void;
  clearCurrentAchievement: () => void;
  
  unlockItem: (itemId: string) => void;
}

const INVENTORY_SIZE = 48;
const CRAFTING_SIZE = 4;

function createEmptyCraftingGrid(): CraftingCell[][] {
  const grid: CraftingCell[][] = [];
  for (let r = 0; r < CRAFTING_SIZE; r++) {
    const row: CraftingCell[] = [];
    for (let c = 0; c < CRAFTING_SIZE; c++) {
      row.push({ itemId: null, id: uuidv4() });
    }
    grid.push(row);
  }
  return grid;
}

function createEmptyInventory(size: number): InventorySlot[] {
  return Array.from({ length: size }, () => ({ itemId: null, count: 0 }));
}

export const useGameStore = create<GameState>((set, get) => ({
  inventory: createEmptyInventory(INVENTORY_SIZE),
  inventorySize: INVENTORY_SIZE,
  craftingGrid: createEmptyCraftingGrid(),
  recipes: [],
  items: {},
  unlockedItems: new Set(),
  isCollecting: false,
  collectProgress: 0,
  cooldownRemaining: 0,
  achievements: [],
  currentAchievement: null,
  matchedRecipe: null,
  isCrafting: false,
  flyingResources: [],

  initGame: async () => {
    set({ items: ALL_ITEMS, recipes: RECIPES });
    
    try {
      const savedInventory = await idbGet('inventory');
      const savedUnlocked = await idbGet('unlockedItems');
      const savedAchievements = await idbGet('achievements');
      
      if (savedInventory && Array.isArray(savedInventory)) {
        set({ inventory: savedInventory });
      } else {
        const inv = createEmptyInventory(INVENTORY_SIZE);
        inv[0] = { itemId: 'stone', count: 10 };
        inv[1] = { itemId: 'wood', count: 10 };
        inv[2] = { itemId: 'iron_ore', count: 5 };
        inv[3] = { itemId: 'crystal_shard', count: 3 };
        set({ inventory: inv });
      }
      
      if (savedUnlocked && Array.isArray(savedUnlocked)) {
        set({ unlockedItems: new Set([...savedUnlocked, 'stone', 'wood', 'iron_ore', 'crystal_shard']) });
      } else {
        set({ unlockedItems: new Set(['stone', 'wood', 'iron_ore', 'crystal_shard']) });
      }
      
      if (savedAchievements && Array.isArray(savedAchievements)) {
        set({ achievements: savedAchievements });
      }
    } catch (e) {
      console.error('Failed to load game:', e);
      const inv = createEmptyInventory(INVENTORY_SIZE);
      inv[0] = { itemId: 'stone', count: 10 };
      inv[1] = { itemId: 'wood', count: 10 };
      inv[2] = { itemId: 'iron_ore', count: 5 };
      inv[3] = { itemId: 'crystal_shard', count: 3 };
      set({ 
        inventory: inv,
        unlockedItems: new Set(['stone', 'wood', 'iron_ore', 'crystal_shard']),
      });
    }
    
    get().checkRecipeMatch();
  },

  saveGame: async () => {
    const { inventory, unlockedItems, achievements } = get();
    try {
      await idbSet('inventory', inventory);
      await idbSet('unlockedItems', Array.from(unlockedItems));
      await idbSet('achievements', achievements);
    } catch (e) {
      console.error('Failed to save game:', e);
    }
  },

  startDrag: (fromType, index, row, col) => {
  },

  placeItem: (toType, index, row, col) => {
  },

  addToInventory: (itemId: string, count: number): boolean => {
    const state = get();
    const item = state.items[itemId];
    if (!item) return false;
    
    const newInventory = [...state.inventory];
    
    for (let i = 0; i < newInventory.length; i++) {
      if (newInventory[i].itemId === itemId && newInventory[i].count < item.maxStack) {
        const canAdd = Math.min(count, item.maxStack - newInventory[i].count);
        newInventory[i] = { ...newInventory[i], count: newInventory[i].count + canAdd };
        count -= canAdd;
        if (count <= 0) break;
      }
    }
    
    if (count > 0) {
      for (let i = 0; i < newInventory.length; i++) {
        if (newInventory[i].itemId === null) {
          const canAdd = Math.min(count, item.maxStack);
          newInventory[i] = { itemId, count: canAdd };
          count -= canAdd;
          if (count <= 0) break;
        }
      }
    }
    
    if (count > 0) return false;
    
    set({ inventory: newInventory });
    state.saveGame();
    return true;
  },

  removeFromInventory: (itemId: string, count: number): boolean => {
    const state = get();
    const newInventory = [...state.inventory];
    
    let remaining = count;
    
    for (let i = 0; i < newInventory.length && remaining > 0; i++) {
      if (newInventory[i].itemId === itemId) {
        if (newInventory[i].count <= remaining) {
          remaining -= newInventory[i].count;
          newInventory[i] = { itemId: null, count: 0 };
        } else {
          newInventory[i] = { ...newInventory[i], count: newInventory[i].count - remaining };
          remaining = 0;
        }
      }
    }
    
    if (remaining > 0) return false;
    
    set({ inventory: newInventory });
    state.saveGame();
    return true;
  },

  canAddToInventory: (itemId: string, count: number): boolean => {
    const state = get();
    const item = state.items[itemId];
    if (!item) return false;
    
    let remaining = count;
    
    for (const slot of state.inventory) {
      if (slot.itemId === itemId && slot.count < item.maxStack) {
        remaining -= Math.min(remaining, item.maxStack - slot.count);
        if (remaining <= 0) return true;
      }
    }
    
    if (remaining > 0) {
      for (const slot of state.inventory) {
        if (slot.itemId === null) {
          remaining -= Math.min(remaining, item.maxStack);
          if (remaining <= 0) return true;
        }
      }
    }
    
    return remaining <= 0;
  },

  isInventoryFull: (): boolean => {
    const state = get();
    for (const slot of state.inventory) {
      if (slot.itemId === null) return false;
    }
    return true;
  },

  addToCraftingGrid: (row: number, col: number, itemId: string): boolean => {
    const state = get();
    if (state.isCrafting) return false;
    if (state.craftingGrid[row][col].itemId !== null) return false;
    
    const newGrid = state.craftingGrid.map((r, ri) =>
      r.map((c, ci) => {
        if (ri === row && ci === col) {
          return { ...c, itemId };
        }
        return c;
      })
    );
    
    set({ craftingGrid: newGrid });
    state.checkRecipeMatch();
    return true;
  },

  removeFromCraftingGrid: (row: number, col: number): string | null => {
    const state = get();
    if (state.isCrafting) return null;
    
    const cell = state.craftingGrid[row][col];
    if (!cell.itemId) return null;
    
    const newGrid = state.craftingGrid.map((r, ri) =>
      r.map((c, ci) => {
        if (ri === row && ci === col) {
          return { ...c, itemId: null };
        }
        return c;
      })
    );
    
    set({ craftingGrid: newGrid });
    state.checkRecipeMatch();
    return cell.itemId;
  },

  swapCraftingCells: (row1: number, col1: number, row2: number, col2: number) => {
    const state = get();
    if (state.isCrafting) return;
    
    const newGrid = state.craftingGrid.map((r, ri) =>
      r.map((c, ci) => ({ ...c }))
    );
    
    const temp = newGrid[row1][col1].itemId;
    newGrid[row1][col1].itemId = newGrid[row2][col2].itemId;
    newGrid[row2][col2].itemId = temp;
    
    set({ craftingGrid: newGrid });
    state.checkRecipeMatch();
  },

  checkRecipeMatch: () => {
    const { craftingGrid, recipes, isCrafting } = get();
    if (isCrafting) return;
    
    const grid: GridCell[][] = craftingGrid.map(row => row.map(cell => cell.itemId));
    const matched = findMatchingRecipe(grid, recipes);
    set({ matchedRecipe: matched });
  },

  performCraft: (): boolean => {
    const state = get();
    const { matchedRecipe } = state;
    
    if (!matchedRecipe || state.isCrafting) return false;
    
    if (!state.canAddToInventory(matchedRecipe.resultItemId, matchedRecipe.resultCount)) {
      return false;
    }
    
    set({ isCrafting: true });
    
    const resultItem = state.items[matchedRecipe.resultItemId];
    
    setTimeout(() => {
      const newGrid = state.craftingGrid.map(row => 
        row.map(cell => ({ ...cell, itemId: null }))
      );
      set({ craftingGrid: newGrid });
      
      state.addToInventory(matchedRecipe.resultItemId, matchedRecipe.resultCount);
      
      if (!state.unlockedItems.has(matchedRecipe.resultItemId)) {
        state.unlockItem(matchedRecipe.resultItemId);
        state.showAchievement(matchedRecipe.resultItemId);
      }
      
      set({ isCrafting: false, matchedRecipe: null });
      state.checkRecipeMatch();
    }, 600);
    
    return true;
  },

  clearCraftingGrid: () => {
    const state = get();
    if (state.isCrafting) return;
    
    state.returnCraftingItems();
    
    const newGrid = state.craftingGrid.map(row => 
      row.map(cell => ({ ...cell, itemId: null }))
    );
    set({ craftingGrid: newGrid });
    state.checkRecipeMatch();
  },

  returnCraftingItems: () => {
    const state = get();
    for (const row of state.craftingGrid) {
      for (const cell of row) {
        if (cell.itemId) {
          state.addToInventory(cell.itemId, 1);
        }
      }
    }
  },

  startCollecting: () => {
    const state = get();
    if (state.isCollecting || state.cooldownRemaining > 0 || state.isInventoryFull()) return;
    
    set({ isCollecting: true, collectProgress: 0 });
  },

  updateCollectProgress: (progress: number) => {
    set({ collectProgress: Math.min(100, progress) });
  },

  finishCollecting: () => {
    const state = get();
    
    const rand = Math.random() * 100;
    let itemId = 'stone';
    if (rand < 40) {
      itemId = 'stone';
    } else if (rand < 70) {
      itemId = 'wood';
    } else if (rand < 90) {
      itemId = 'iron_ore';
    } else {
      itemId = 'crystal_shard';
    }
    
    const count = Math.floor(Math.random() * 3) + 1;
    
    const actualCount = state.canAddToInventory(itemId, count) ? count : 0;
    if (actualCount > 0) {
      state.addToInventory(itemId, actualCount);
    }
    
    set({ 
      isCollecting: false, 
      collectProgress: 0,
      cooldownRemaining: 5,
    });
  },

  setCooldown: (seconds: number) => {
    set({ cooldownRemaining: seconds });
  },

  updateCooldown: (delta: number) => {
    const state = get();
    if (state.cooldownRemaining > 0) {
      const newCooldown = Math.max(0, state.cooldownRemaining - delta);
      set({ cooldownRemaining: newCooldown });
    }
  },

  addFlyingResource: (resource) => {
    const id = uuidv4();
    set(state => ({
      flyingResources: [...state.flyingResources, { ...resource, id }],
    }));
  },

  removeFlyingResource: (id) => {
    set(state => ({
      flyingResources: state.flyingResources.filter(r => r.id !== id),
    }));
  },

  showAchievement: (itemId) => {
    const achievement: Achievement = {
      id: uuidv4(),
      itemId,
      timestamp: Date.now(),
    };
    
    set(state => ({
      currentAchievement: achievement,
      achievements: [...state.achievements, achievement],
    }));
    
    setTimeout(() => {
      set({ currentAchievement: null });
    }, 3000);
  },

  clearCurrentAchievement: () => {
    set({ currentAchievement: null });
  },

  unlockItem: (itemId) => {
    set(state => {
      const newUnlocked = new Set(state.unlockedItems);
      newUnlocked.add(itemId);
      return { unlockedItems: newUnlocked };
    });
    get().saveGame();
  },
}));
