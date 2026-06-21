import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  User,
  Recipe,
  MealPlanEntry,
  ShoppingItem,
  MealSlot,
  WeekDay,
  ToastItem,
  WsMealPlanUpdated,
  WsShoppingListChecked,
  WsToastNotify,
} from '@/types';
import { mockUsers, mockRecipes, generateShoppingList, getMonday } from '@/data/mockData';

interface AppState {
  currentUser: User;
  recipes: Recipe[];
  mealPlanEntries: MealPlanEntry[];
  shoppingItems: ShoppingItem[];
  toasts: ToastItem[];
  connected: boolean;
  lastUpdateFromRemote: boolean;

  addMealPlanEntry: (day: WeekDay, slot: MealSlot, recipeId: string) => void;
  removeMealPlanEntry: (day: WeekDay, slot: MealSlot) => void;
  moveMealPlanEntry: (fromDay: WeekDay, fromSlot: MealSlot, toDay: WeekDay, toSlot: MealSlot) => void;

  toggleShoppingItem: (ingredientId: string) => void;
  forceSyncShoppingList: () => void;
  regenerateShoppingList: () => void;

  broadcastMealPlanUpdate: (payload: WsMealPlanUpdated) => void;
  broadcastShoppingChecked: (payload: WsShoppingListChecked) => void;
  broadcastToast: (payload: WsToastNotify) => void;

  addToast: (message: string, type: ToastItem['type']) => void;
  removeToast: (id: string) => void;

  applyRemoteMealPlanUpdate: (payload: WsMealPlanUpdated) => void;
  applyRemoteShoppingChecked: (payload: WsShoppingListChecked) => void;
}

const currentWeekStart = getMonday(new Date()).toISOString().slice(0, 10);

const initialMealPlanEntries: MealPlanEntry[] = [
  { id: uuidv4(), day: 0, slot: 'breakfast', recipeId: 'r3', addedBy: 'u1' },
  { id: uuidv4(), day: 0, slot: 'lunch', recipeId: 'r1', addedBy: 'u1' },
  { id: uuidv4(), day: 0, slot: 'dinner', recipeId: 'r2', addedBy: 'u1' },
  { id: uuidv4(), day: 1, slot: 'breakfast', recipeId: 'r8', addedBy: 'u2' },
  { id: uuidv4(), day: 1, slot: 'dinner', recipeId: 'r5', addedBy: 'u2' },
  { id: uuidv4(), day: 2, slot: 'lunch', recipeId: 'r4', addedBy: 'u1' },
  { id: uuidv4(), day: 2, slot: 'dinner', recipeId: 'r7', addedBy: 'u1' },
];

const initialShoppingItems = generateShoppingList(initialMealPlanEntries, mockRecipes);

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: mockUsers[2],
  recipes: mockRecipes,
  mealPlanEntries: initialMealPlanEntries,
  shoppingItems: initialShoppingItems,
  toasts: [],
  connected: true,
  lastUpdateFromRemote: false,

  addMealPlanEntry: (day, slot, recipeId) => {
    const { currentUser, mealPlanEntries, recipes } = get();
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    const existingIdx = mealPlanEntries.findIndex((e) => e.day === day && e.slot === slot);
    let newEntries: MealPlanEntry[];

    if (existingIdx >= 0) {
      newEntries = mealPlanEntries.map((e, i) =>
        i === existingIdx ? { ...e, recipeId, recipe, addedBy: currentUser.id } : e
      );
    } else {
      newEntries = [
        ...mealPlanEntries,
        { id: uuidv4(), day, slot, recipeId, recipe, addedBy: currentUser.id },
      ];
    }

    set({ mealPlanEntries: newEntries, lastUpdateFromRemote: false });
    get().regenerateShoppingList();

    const added = newEntries.find((e) => e.day === day && e.slot === slot) || null;
    get().broadcastMealPlanUpdate({
      entry: added,
      action: 'add',
      by: currentUser,
      toDay: day,
      toSlot: slot,
    });
  },

  removeMealPlanEntry: (day, slot) => {
    const { currentUser, mealPlanEntries } = get();
    const removed = mealPlanEntries.find((e) => e.day === day && e.slot === slot);
    const newEntries = mealPlanEntries.filter((e) => !(e.day === day && e.slot === slot));

    set({ mealPlanEntries: newEntries, lastUpdateFromRemote: false });
    get().regenerateShoppingList();

    get().broadcastMealPlanUpdate({
      entry: removed || null,
      action: 'remove',
      by: currentUser,
      fromDay: day,
      fromSlot: slot,
    });
  },

  moveMealPlanEntry: (fromDay, fromSlot, toDay, toSlot) => {
    const { currentUser, mealPlanEntries } = get();
    if (fromSlot !== toSlot) return;

    const sourceIdx = mealPlanEntries.findIndex((e) => e.day === fromDay && e.slot === fromSlot);
    if (sourceIdx < 0) return;

    const source = mealPlanEntries[sourceIdx];
    const targetExistsIdx = mealPlanEntries.findIndex((e) => e.day === toDay && e.slot === toSlot);

    let newEntries = [...mealPlanEntries];
    if (targetExistsIdx >= 0) {
      newEntries[targetExistsIdx] = { ...newEntries[sourceIdx], day: toDay, addedBy: currentUser.id };
      newEntries.splice(sourceIdx, 1);
    } else {
      newEntries[sourceIdx] = { ...source, day: toDay, addedBy: currentUser.id };
    }

    set({ mealPlanEntries: newEntries, lastUpdateFromRemote: false });
    get().regenerateShoppingList();

    get().broadcastMealPlanUpdate({
      entry: { ...source, day: toDay },
      action: 'move',
      by: currentUser,
      fromDay,
      fromSlot,
      toDay,
      toSlot,
    });
  },

  toggleShoppingItem: (ingredientId) => {
    const { currentUser, shoppingItems } = get();
    const item = shoppingItems.find((i) => i.ingredientId === ingredientId);
    if (!item) return;

    const newPurchased = !item.purchased;
    const newItems = shoppingItems.map((i) =>
      i.ingredientId === ingredientId
        ? { ...i, purchased: newPurchased, purchasedBy: newPurchased ? currentUser.id : undefined }
        : i
    );

    set({ shoppingItems: newItems, lastUpdateFromRemote: false });

    get().broadcastShoppingChecked({
      ingredientId,
      purchased: newPurchased,
      by: currentUser,
    });
  },

  forceSyncShoppingList: () => {
    get().regenerateShoppingList();
    get().addToast('采购清单已同步最新数据', 'success');
  },

  regenerateShoppingList: () => {
    const { mealPlanEntries, recipes, shoppingItems } = get();
    const newItems = generateShoppingList(mealPlanEntries, recipes);
    const purchasedMap = new Map(shoppingItems.map((i) => [i.ingredientId, { purchased: i.purchased, purchasedBy: i.purchasedBy }]));
    const merged = newItems.map((ni) => {
      const existing = purchasedMap.get(ni.ingredientId);
      return existing ? { ...ni, purchased: existing.purchased, purchasedBy: existing.purchasedBy } : ni;
    });
    set({ shoppingItems: merged });
  },

  broadcastMealPlanUpdate: (_payload) => {
    // In real app: socket.emit('meal-plan:updated', payload)
    // Simulated remote echo handled below in applyRemote...
    if (Math.random() > 0.6) {
      setTimeout(() => {
        const otherUser = mockUsers[Math.floor(Math.random() * 2)];
        get().addToast(`${otherUser.nickname} 已看到菜单更新`, 'info');
      }, 800);
    }
  },

  broadcastShoppingChecked: (_payload) => {
    // In real app: socket.emit('shopping-list:checked', payload)
  },

  broadcastToast: (payload) => {
    get().addToast(payload.message, payload.type);
  },

  addToast: (message, type) => {
    const id = uuidv4();
    const toast: ToastItem = { id, message, type };
    set({ toasts: [...get().toasts, toast] });
    setTimeout(() => get().removeToast(id), 3500);
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },

  applyRemoteMealPlanUpdate: (payload) => {
    const { mealPlanEntries, recipes } = get();
    const { action, fromDay, fromSlot, toDay, toSlot } = payload;
    let newEntries = [...mealPlanEntries];

    if (action === 'add' && toDay !== undefined && toSlot !== undefined) {
      const existingIdx = newEntries.findIndex((e) => e.day === toDay && e.slot === toSlot);
      if (existingIdx >= 0) {
        newEntries.splice(existingIdx, 1);
      }
      if (payload.entry) {
        const r = recipes.find((x) => x.id === payload.entry!.recipeId);
        newEntries.push({ ...payload.entry, recipe: r });
      }
    } else if (action === 'remove' && fromDay !== undefined && fromSlot !== undefined) {
      newEntries = newEntries.filter((e) => !(e.day === fromDay && e.slot === fromSlot));
    } else if (action === 'move' && fromDay !== undefined && fromSlot !== undefined && toDay !== undefined && toSlot !== undefined) {
      const sourceIdx = newEntries.findIndex((e) => e.day === fromDay && e.slot === fromSlot);
      if (sourceIdx >= 0) {
        const targetIdx = newEntries.findIndex((e) => e.day === toDay && e.slot === toSlot);
        if (targetIdx >= 0 && targetIdx !== sourceIdx) {
          newEntries.splice(targetIdx, 1, { ...newEntries[sourceIdx], day: toDay });
          newEntries.splice(sourceIdx, 1);
        } else {
          newEntries[sourceIdx] = { ...newEntries[sourceIdx], day: toDay };
        }
      }
    }

    set({ mealPlanEntries: newEntries, lastUpdateFromRemote: true });
    get().regenerateShoppingList();
    get().addToast(`${payload.by.nickname} ${action === 'add' ? '添加了菜单' : action === 'remove' ? '移除了菜单' : '调整了菜单'}`, 'info');
  },

  applyRemoteShoppingChecked: (payload) => {
    const { shoppingItems } = get();
    const newItems = shoppingItems.map((i) =>
      i.ingredientId === payload.ingredientId
        ? { ...i, purchased: payload.purchased, purchasedBy: payload.purchased ? payload.by.id : undefined }
        : i
    );
    set({ shoppingItems: newItems, lastUpdateFromRemote: true });
    get().addToast(
      `${payload.by.nickname} ${payload.purchased ? '标记已购' : '取消标记'}: ${newItems.find((i) => i.ingredientId === payload.ingredientId)?.name || ''}`,
      'info'
    );
  },
}));

export const WEEK_START_DATE = currentWeekStart;
