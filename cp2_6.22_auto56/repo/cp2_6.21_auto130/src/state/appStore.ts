import { create } from 'zustand';
import { mockService } from '@/services/mockService';
import { mockSocket, type WsEventName } from '@/services/mockSocket';

export interface User {
  id: string;
  nickname: string;
  avatarUrl: string;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: 'vegetable' | 'meat' | 'spice' | 'dairy' | 'grain' | 'seafood' | 'other';
  estimatedPrice?: number;
}

export interface Recipe {
  id: string;
  name: string;
  authorId: string;
  author?: User;
  thumbnail?: string;
  heroImage?: string;
  cookTimeMinutes: number;
  difficulty: 1 | 2 | 3;
  mainIngredients: string[];
  ingredients: Ingredient[];
  steps: string[];
  avgRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  recipeId: string;
  userId: string;
  user?: User;
  rating: 1 | 2 | 3 | 4 | 5;
  content: string;
  createdAt: string;
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner';
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface MealPlanEntry {
  day: WeekDay;
  slot: MealSlot;
  recipeId: string;
  recipe?: Recipe;
  addedBy: string;
}

export type SupermarketZone =
  | 'produce'
  | 'meat_seafood'
  | 'dairy_eggs'
  | 'seasoning'
  | 'staples'
  | 'other';

export interface ShoppingItem {
  ingredientId: string;
  name: string;
  totalQuantity: number;
  unit: string;
  category: Ingredient['category'];
  supermarketZone: SupermarketZone;
  estimatedPrice?: number;
  purchased: boolean;
  purchasedBy?: string;
}

export interface ShoppingList {
  weekStartDate: string;
  items: ShoppingItem[];
  lastUpdatedAt: string;
  updatedBy: string;
}

export type ToastType = 'info' | 'success' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export type MealPlanGrid = (MealPlanEntry | null)[][];

const DAYS: WeekDay[] = [0, 1, 2, 3, 4, 5, 6];
const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner'];

function buildEmptyGrid(): MealPlanGrid {
  return DAYS.map(() => SLOTS.map(() => null));
}

function entriesToGrid(entries: MealPlanEntry[]): MealPlanGrid {
  const grid = buildEmptyGrid();
  for (const e of entries) {
    if (e.day >= 0 && e.day <= 6) {
      const slotIdx = SLOTS.indexOf(e.slot);
      if (slotIdx !== -1) {
        grid[e.day][slotIdx] = e;
      }
    }
  }
  return grid;
}

function gridToEntries(grid: MealPlanGrid): MealPlanEntry[] {
  const result: MealPlanEntry[] = [];
  for (let d = 0; d < 7; d++) {
    for (let s = 0; s < 3; s++) {
      const entry = grid[d][s];
      if (entry) result.push(entry);
    }
  }
  return result;
}

function findNextEmptySlot(grid: MealPlanGrid): { day: WeekDay; slot: MealSlot } | null {
  for (let d = 0; d < 7; d++) {
    for (let s = 0; s < 3; s++) {
      if (!grid[d][s]) {
        return { day: d as WeekDay, slot: SLOTS[s] };
      }
    }
  }
  return null;
}

export interface LoadingState {
  init: boolean;
  recipes: boolean;
  mealPlan: boolean;
  shoppingList: boolean;
  addComment: boolean;
  shoppingSync: boolean;
}

export interface AppState {
  currentUser: User | null;
  recipes: Recipe[];
  mealPlan: MealPlanGrid;
  shoppingList: ShoppingList | null;
  wsConnected: boolean;
  toasts: Toast[];
  loading: LoadingState;

  /** 派生：扁平化菜单条目（兼容旧API） */
  mealPlanEntries: MealPlanEntry[];
  /** 派生：采购清单项（兼容旧API） */
  shoppingItems: ShoppingItem[];

  init: () => Promise<void>;
  setRecipes: (recipes: Recipe[]) => void;
  addRecipeToMealPlan: (recipeId: string, day?: WeekDay, slot?: MealSlot) => boolean;
  addRecipeToNextAvailableSlot: (recipeId: string) => boolean;
  /** 新API：按(day, slot)直接添加（MealPlanner用） */
  addMealPlanEntry: (day: WeekDay, slot: MealSlot, recipeId: string) => void;
  moveMealPlanEntry: (
    from: { day: WeekDay; slot: MealSlot },
    to: { day: WeekDay; slot: MealSlot }
  ) => boolean;
  /** 兼容旧API：单独参数版移动 */
  moveMealPlanEntryFlat: (
    fromDay: WeekDay,
    fromSlot: MealSlot,
    toDay: WeekDay,
    toSlot: MealSlot
  ) => void;
  removeMealPlanEntry: (day: WeekDay, slot: MealSlot) => void;
  setShoppingList: (list: ShoppingList) => void;
  toggleShoppingItem: (ingredientId: string) => void;
  /** 强制从后端拉取最新版本并覆盖本地状态（丢弃已勾选状态） */
  forceSyncShoppingList: () => Promise<void>;
  addComment: (recipeId: string, rating: number, content: string) => Promise<Comment | null>;
  pushToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  setLoading: <K extends keyof LoadingState>(key: K, value: boolean) => void;
}

let toastCounter = 0;
const nextToastId = () => `toast-${Date.now()}-${++toastCounter}`;

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  recipes: [],
  mealPlan: buildEmptyGrid(),
  mealPlanEntries: [],
  shoppingList: null,
  shoppingItems: [],
  wsConnected: false,
  toasts: [],
  loading: {
    init: false,
    recipes: false,
    mealPlan: false,
    shoppingList: false,
    addComment: false,
    shoppingSync: false,
  },

  setLoading: (key, value) =>
    set((s) => ({ loading: { ...s.loading, [key]: value } })),

  init: async () => {
    const s = get();
    if (s.loading.init) return;
    get().setLoading('init', true);
    try {
      const [user, recipes, mealPlanEntries, shoppingList] = await Promise.all([
        mockService.getCurrentUser(),
        mockService.getRecipes(),
        mockService.getMealPlan(),
        mockService.getShoppingList(),
      ]);
      const grid = entriesToGrid(mealPlanEntries);
      set({
        currentUser: user,
        recipes,
        mealPlan: grid,
        mealPlanEntries: gridToEntries(grid),
        shoppingList,
        shoppingItems: shoppingList?.items ?? [],
      });
      get().connectWebSocket();
    } catch (e) {
      console.error('[appStore] init failed:', e);
      get().pushToast('warning', '初始化数据失败，请刷新重试');
    } finally {
      get().setLoading('init', false);
    }
  },

  setRecipes: (recipes) => set({ recipes }),

  addRecipeToMealPlan: (recipeId, day, slot) => {
    const state = get();
    const recipe = state.recipes.find((r) => r.id === recipeId);
    if (!recipe) return false;
    const user = state.currentUser;
    if (!user) return false;

    const grid = state.mealPlan.map((row) => [...row]);

    let targetDay: WeekDay;
    let targetSlot: MealSlot;

    if (day !== undefined && slot !== undefined) {
      targetDay = day;
      targetSlot = slot;
    } else {
      const next = findNextEmptySlot(grid);
      if (!next) {
        get().pushToast('warning', '本周菜单已满，请先移除一些菜品');
        return false;
      }
      targetDay = next.day;
      targetSlot = next.slot;
    }

    const slotIdx = SLOTS.indexOf(targetSlot);
    if (grid[targetDay][slotIdx]) {
      get().pushToast('warning', '该时段已有菜品，请选择其他时段');
      return false;
    }

    const entry: MealPlanEntry = {
      day: targetDay,
      slot: targetSlot,
      recipeId,
      recipe,
      addedBy: user.id,
    };

    grid[targetDay][slotIdx] = entry;
    set({ mealPlan: grid, mealPlanEntries: gridToEntries(grid) });

    if (state.wsConnected) {
      mockSocket.emit('meal-plan:updated', { entry, action: 'add', by: user });
    }
    get().pushToast('success', `已将「${recipe.name}」加入菜单`);
    return true;
  },

  addRecipeToNextAvailableSlot: (recipeId) => {
    return get().addRecipeToMealPlan(recipeId);
  },

  addMealPlanEntry: (day, slot, recipeId) => {
    get().addRecipeToMealPlan(recipeId, day, slot);
  },

  moveMealPlanEntry: (from, to) => {
    const state = get();
    const grid = state.mealPlan.map((row) => [...row]);

    const fromSlotIdx = SLOTS.indexOf(from.slot);
    const toSlotIdx = SLOTS.indexOf(to.slot);
    const source = grid[from.day][fromSlotIdx];

    if (!source) return false;
    if (to.day === from.day && to.slot === from.slot) return true;

    const target = grid[to.day][toSlotIdx];
    grid[from.day][fromSlotIdx] = target
      ? { ...target, day: from.day, slot: from.slot }
      : null;
    grid[to.day][toSlotIdx] = { ...source, day: to.day, slot: to.slot };

    set({ mealPlan: grid, mealPlanEntries: gridToEntries(grid) });
    const user = state.currentUser;
    if (state.wsConnected && user) {
      mockSocket.emit('meal-plan:updated', { entry: grid[to.day][toSlotIdx], action: 'move', by: user });
    }
    return true;
  },

  moveMealPlanEntryFlat: (fromDay, fromSlot, toDay, toSlot) => {
    if (fromSlot !== toSlot) {
      get().pushToast('warning', '仅允许在相同餐次间跨日期移动（如：周一早餐 → 周三早餐）');
      return;
    }
    get().moveMealPlanEntry(
      { day: fromDay, slot: fromSlot },
      { day: toDay, slot: toSlot }
    );
  },

  removeMealPlanEntry: (day, slot) => {
    const state = get();
    const grid = state.mealPlan.map((row) => [...row]);
    const slotIdx = SLOTS.indexOf(slot);
    const removed = grid[day][slotIdx];
    grid[day][slotIdx] = null;
    set({ mealPlan: grid, mealPlanEntries: gridToEntries(grid) });

    const user = state.currentUser;
    if (state.wsConnected && user && removed) {
      mockSocket.emit('meal-plan:updated', { entry: null, action: 'remove', by: user });
    }
    if (removed?.recipe) {
      get().pushToast('info', `已从菜单移除「${removed.recipe.name}」`);
    }
  },

  setShoppingList: (list) =>
    set({ shoppingList: list, shoppingItems: list?.items ?? [] }),

  toggleShoppingItem: (ingredientId) => {
    const state = get();
    if (!state.shoppingList) return;
    const items = state.shoppingList.items.map((it) => {
      if (it.ingredientId !== ingredientId) return it;
      const purchased = !it.purchased;
      return {
        ...it,
        purchased,
        purchasedBy: purchased ? state.currentUser?.id : undefined,
      };
    });
    const list: ShoppingList = {
      ...state.shoppingList,
      items,
      lastUpdatedAt: new Date().toISOString(),
      updatedBy: state.currentUser?.id ?? state.shoppingList.updatedBy,
    };
    set({
      shoppingList: list,
      shoppingItems: list.items,
    });

    const item = items.find((i) => i.ingredientId === ingredientId);
    if (state.wsConnected && state.currentUser && item) {
      mockSocket.emit('shopping-list:checked', {
        ingredientId,
        purchased: item.purchased,
        by: state.currentUser,
      });
    }
  },

  forceSyncShoppingList: async () => {
    const state = get();
    get().setLoading('shoppingSync', true);
    try {
      const freshList = await mockService.getShoppingList(true);
      set({
        shoppingList: freshList,
        shoppingItems: freshList.items,
      });
      get().pushToast('success', '已同步最新采购清单，勾选状态已重置');
    } catch (e) {
      console.error('[appStore] forceSyncShoppingList failed:', e);
      get().pushToast('warning', '同步失败，请稍后重试');
    } finally {
      get().setLoading('shoppingSync', false);
    }
  },

  addComment: async (recipeId, rating, content) => {
    const state = get();
    if (!state.currentUser) return null;
    get().setLoading('addComment', true);
    try {
      const comment = await mockService.addComment(
        recipeId,
        state.currentUser.id,
        rating,
        content
      );
      if (state.wsConnected) {
        mockSocket.emit('comment:new', { comment });
      }
      get().pushToast('success', '评论发布成功');
      return comment;
    } catch (e) {
      console.error('[appStore] addComment failed:', e);
      get().pushToast('warning', '评论发布失败，请重试');
      return null;
    } finally {
      get().setLoading('addComment', false);
    }
  },

  pushToast: (type, message) => {
    const id = nextToastId();
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 3000);
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  connectWebSocket: () => {
    if (get().wsConnected) return;

    const handlers: Partial<Record<WsEventName, (payload: unknown) => void>> = {
      'toast:notify': (p) => {
        const { type, message } = p as { type: ToastType; message: string };
        get().pushToast(type, message);
      },
      'meal-plan:updated': (p) => {
        const { entry, action } = p as {
          entry: MealPlanEntry | null;
          action: 'add' | 'remove' | 'move';
        };
        void action;
        void entry;
      },
      'shopping-list:checked': (p) => {
        const payload = p as { ingredientId: string; purchased: boolean; by: User };
        const state = get();
        if (!state.shoppingList || payload.by.id === state.currentUser?.id) return;
        const items = state.shoppingList.items.map((it) =>
          it.ingredientId === payload.ingredientId
            ? { ...it, purchased: payload.purchased, purchasedBy: payload.by.id }
            : it
        );
        set({
          shoppingList: {
            ...state.shoppingList,
            items,
            lastUpdatedAt: new Date().toISOString(),
            updatedBy: payload.by.id,
          },
          shoppingItems: items,
        });
      },
      'room:join': (p) => {
        const payload = p as { userId: string; nickname: string };
        const state = get();
        if (payload.userId !== state.currentUser?.id) {
          get().pushToast('info', `${payload.nickname} 加入了房间`);
        }
      },
    };

    (Object.keys(handlers) as WsEventName[]).forEach((evt) => {
      const h = handlers[evt];
      if (h) mockSocket.on(evt, h as never);
    });

    mockSocket.connect();
    set({ wsConnected: true });
  },

  disconnectWebSocket: () => {
    mockSocket.disconnect();
    set({ wsConnected: false });
  },
}));

export const getMealPlanEntries = (grid: MealPlanGrid): MealPlanEntry[] =>
  gridToEntries(grid);
