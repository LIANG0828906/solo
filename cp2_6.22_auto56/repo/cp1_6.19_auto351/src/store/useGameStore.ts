import { create } from 'zustand';
import type { Item, CharacterStatus, HistoryEntry, DragItemData } from '@/types';
import { INITIAL_MATERIALS, RECIPES, matchRecipe } from '@/data/recipes';

interface GameState {
  items: Item[];
  workbenchItems: Item[];
  status: CharacterStatus;
  history: HistoryEntry[];
  maxSlots: number;
  toast: { message: string; type: 'error' | 'success' } | null;
  craftAnimation: {
    active: boolean;
    type: 'success' | 'fail';
    recipeName?: string;
    recipeColor?: string;
  };

  getUsedSlots: () => number;
  canAddItem: (slots: number) => boolean;
  addItem: (item: Item) => void;
  removeItem: (itemId: string, count?: number) => void;
  moveToWorkbench: (itemId: string) => void;
  moveFromWorkbench: (itemId: string) => void;
  clearWorkbench: () => void;
  craftItem: () => void;
  setToast: (toast: { message: string; type: 'error' | 'success' } | null) => void;
  triggerCraftAnimation: (type: 'success' | 'fail', recipeName?: string, recipeColor?: string) => void;
  clearCraftAnimation: () => void;
  tickSurvival: () => void;
}

function aggregateItems(itemList: Item[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of itemList) {
    map[item.id] = (map[item.id] || 0) + item.count;
  }
  return map;
}

export const useGameStore = create<GameState>((set, get) => ({
  items: INITIAL_MATERIALS.map((m) => ({ ...m })),
  workbenchItems: [],
  status: { health: 100, hunger: 80, thirst: 70 },
  history: [],
  maxSlots: 20,
  toast: null,
  craftAnimation: { active: false, type: 'fail' },

  getUsedSlots: () => {
    const state = get();
    return state.items.reduce((sum, item) => sum + item.slots * item.count, 0);
  },

  canAddItem: (slots: number) => {
    const state = get();
    const used = state.items.reduce((sum, item) => sum + item.slots * item.count, 0);
    return used + slots <= state.maxSlots;
  },

  addItem: (item: Item) => {
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, count: i.count + item.count } : i
          ),
        };
      }
      return { items: [...state.items, { ...item }] };
    });
  },

  removeItem: (itemId: string, count: number = 1) => {
    set((state) => {
      const item = state.items.find((i) => i.id === itemId);
      if (!item) return state;

      if (item.count <= count) {
        return { items: state.items.filter((i) => i.id !== itemId) };
      }
      return {
        items: state.items.map((i) =>
          i.id === itemId ? { ...i, count: i.count - count } : i
        ),
      };
    });
  },

  moveToWorkbench: (itemId: string) => {
    set((state) => {
      const item = state.items.find((i) => i.id === itemId);
      if (!item || item.count <= 0) return state;

      const existingBench = state.workbenchItems.find((i) => i.id === itemId);
      const newWorkbench = existingBench
        ? state.workbenchItems.map((i) =>
            i.id === itemId ? { ...i, count: i.count + 1 } : i
          )
        : [...state.workbenchItems, { ...item, count: 1 }];

      let newItems: Item[];
      if (item.count <= 1) {
        newItems = state.items.filter((i) => i.id !== itemId);
      } else {
        newItems = state.items.map((i) =>
          i.id === itemId ? { ...i, count: i.count - 1 } : i
        );
      }

      return { items: newItems, workbenchItems: newWorkbench };
    });
  },

  moveFromWorkbench: (itemId: string) => {
    set((state) => {
      const benchItem = state.workbenchItems.find((i) => i.id === itemId);
      if (!benchItem) return state;

      const existingBackpack = state.items.find((i) => i.id === itemId);
      const newItems = existingBackpack
        ? state.items.map((i) =>
            i.id === itemId ? { ...i, count: i.count + 1 } : i
          )
        : [...state.items, { ...benchItem, count: 1 }];

      let newWorkbench: Item[];
      if (benchItem.count <= 1) {
        newWorkbench = state.workbenchItems.filter((i) => i.id !== itemId);
      } else {
        newWorkbench = state.workbenchItems.map((i) =>
          i.id === itemId ? { ...i, count: i.count - 1 } : i
        );
      }

      return { items: newItems, workbenchItems: newWorkbench };
    });
  },

  clearWorkbench: () => {
    set((state) => {
      const returnedItems = [...state.workbenchItems];
      let newItems = [...state.items];

      for (const benchItem of returnedItems) {
        const existing = newItems.find((i) => i.id === benchItem.id);
        if (existing) {
          newItems = newItems.map((i) =>
            i.id === benchItem.id ? { ...i, count: i.count + benchItem.count } : i
          );
        } else {
          newItems.push({ ...benchItem });
        }
      }

      return { items: newItems, workbenchItems: [] };
    });
  },

  craftItem: () => {
    const state = get();
    const benchIngredients = aggregateItems(state.workbenchItems);
    const recipe = matchRecipe(benchIngredients);

    if (!recipe) {
      get().triggerCraftAnimation('fail');
      return;
    }

    const canAdd = get().canAddItem(recipe.slots);
    if (!canAdd) {
      get().setToast({ message: '背包已满', type: 'error' });
      return;
    }

    const newItem: Item = {
      id: recipe.id,
      name: recipe.name,
      icon: recipe.icon,
      count: 1,
      weight: Object.values(recipe.ingredients).reduce((s, n) => s + n, 0),
      slots: recipe.slots,
      color: recipe.color,
    };

    const historyEntry: HistoryEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      itemName: recipe.name,
      itemCount: 1,
      recipeName: recipe.name,
      recipeColor: recipe.color,
    };

    let newStatus = { ...state.status };
    if (recipe.statEffects) {
      if (recipe.statEffects.health) {
        newStatus.health = Math.min(100, newStatus.health + recipe.statEffects.health);
      }
      if (recipe.statEffects.hunger) {
        newStatus.hunger = Math.min(100, newStatus.hunger + recipe.statEffects.hunger);
      }
      if (recipe.statEffects.thirst) {
        newStatus.thirst = Math.min(100, newStatus.thirst + recipe.statEffects.thirst);
      }
    }

    const existingItem = state.items.find((i) => i.id === recipe.id);
    let newItems: Item[];
    if (existingItem) {
      newItems = state.items.map((i) =>
        i.id === recipe.id ? { ...i, count: i.count + 1 } : i
      );
    } else {
      newItems = [...state.items, newItem];
    }

    const newHistory = [historyEntry, ...state.history].slice(0, 10);

    set({
      items: newItems,
      workbenchItems: [],
      status: newStatus,
      history: newHistory,
    });

    get().triggerCraftAnimation('success', recipe.name, recipe.color);
    get().setToast({ message: `合成成功：${recipe.name}`, type: 'success' });
  },

  setToast: (toast) => set({ toast }),

  triggerCraftAnimation: (type, recipeName?, recipeColor?) => {
    set({
      craftAnimation: { active: true, type, recipeName, recipeColor },
    });
  },

  clearCraftAnimation: () => {
    set({ craftAnimation: { active: false, type: 'fail' } });
  },

  tickSurvival: () => {
    set((state) => {
      let { health, hunger, thirst } = state.status;

      hunger = Math.max(0, hunger - 1);
      thirst = Math.max(0, thirst - 1);

      if (hunger === 0 || thirst === 0) {
        health = Math.max(0, health - 1);
      }

      return { status: { health, hunger, thirst } };
    });
  },
}));
