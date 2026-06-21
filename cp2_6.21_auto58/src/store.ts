import { create } from 'zustand';
import { Recipe, InventoryItem, ShoppingListItem, Ingredient, SortOrder, isNumericQuantity, toNumericQuantity } from './types';
import * as api from './api';

interface AppState {
  recipes: Recipe[];
  inventory: InventoryItem[];
  shoppingList: ShoppingListItem[];
  selectedRecipeIds: string[];
  searchQuery: string;
  sortOrder: SortOrder;
  ingredientNames: string[];
  loading: boolean;

  _recipesCacheTime: number;
  _inventoryCacheTime: number;
  _ingredientNamesCacheTime: number;
  CACHE_TTL: number;

  setRecipes: (recipes: Recipe[]) => void;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  getRecipeById: (id: string) => Recipe | undefined;

  setInventory: (inventory: InventoryItem[]) => void;
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (id: string) => void;

  setShoppingList: (list: ShoppingListItem[]) => void;
  updateShoppingListItem: (id: string, updates: Partial<ShoppingListItem>) => void;
  removeShoppingListItem: (id: string) => void;

  toggleRecipeSelection: (id: string) => void;
  clearSelection: () => void;
  setSearchQuery: (query: string) => void;
  setSortOrder: (order: SortOrder) => void;

  fetchRecipes: (force?: boolean) => Promise<void>;
  fetchInventory: (force?: boolean) => Promise<void>;
  fetchIngredientNames: (force?: boolean) => Promise<void>;

  generateShoppingList: (scaledIngredientsMap?: Map<string, {quantity: number, unit: string, name: string}[]>) => void;
  getAllIngredientNames: () => string[];
}

const categorizeIngredient = (name: string): ShoppingListItem['category'] => {
  const specialOthers = ['鸡蛋', '鸭蛋', '鹅蛋', '鹌鹑蛋', '皮蛋', '咸蛋'];
  const seasoningKeywords = ['盐', '糖', '醋', '酱油', '油', '酱', '料酒', '味精', '鸡精', '胡椒', '花椒', '八角', '桂皮', '香叶', '咖喱', '淀粉', '面粉', '生粉', '蚝油', '生抽', '老抽', '香油', '麻油', '豆瓣酱', '番茄酱', '芥末', '芝麻', '麻酱', '花椒粉', '胡椒粉', '辣椒粉', '孜然', '五香粉', '十三香', '蜂蜜', '红糖', '冰糖', '蒸鱼豉油', '味极鲜', '香醋', '陈醋', '白醋', '米酒', '黄酒'];
  const meatKeywords = ['猪肉', '牛肉', '羊肉', '鸡肉', '鸭肉', '鱼肉', '虾', '蟹', '排骨', '里脊', '火腿', '培根', '香肠', '腊肉', '五花肉', '瘦肉', '肥肉', '肉馅', '肉末', '鱼片', '鱼块'];
  const vegetableKeywords = ['菜', '茄', '瓜', '葱', '蒜', '姜', '菇', '笋', '萝卜', '白菜', '菠菜', '生菜', '芹菜', '韭菜', '洋葱', '番茄', '西红柿', '土豆', '胡萝卜', '黄瓜', '南瓜', '冬瓜', '苦瓜', '茄子', '青椒', '辣椒', '香菇', '金针菇', '木耳', '海带', '紫菜', '豆芽', '豆腐', '西兰花', '花椰菜', '卷心菜', '豆角', '豌豆', '玉米', '山药', '莲藕', '红薯'];

  for (const w of specialOthers) {
    if (name.includes(w)) return '其他';
  }
  for (const kw of seasoningKeywords) {
    if (name.includes(kw)) return '调味料';
  }
  for (const kw of meatKeywords) {
    if (name.includes(kw)) return '肉类';
  }
  for (const kw of vegetableKeywords) {
    if (name.includes(kw)) return '蔬菜';
  }
  return '其他';
};

const mockRecipes: Recipe[] = [
  {
    id: '1', name: '红烧肉', cooking_time: 90, servings: 2,
    ingredients: [
      { name: '五花肉', quantity: 500, unit: '克' },
      { name: '冰糖', quantity: 20, unit: '克' },
      { name: '生抽', quantity: 20, unit: '毫升' },
      { name: '老抽', quantity: 10, unit: '毫升' },
      { name: '料酒', quantity: 30, unit: '毫升' },
      { name: '生姜', quantity: 3, unit: '片' },
      { name: '大葱', quantity: 1, unit: '根' },
      { name: '八角', quantity: 2, unit: '个' },
      { name: '桂皮', quantity: 1, unit: '块' },
    ],
    steps: ['五花肉切块焯水', '锅中放糖炒出糖色', '放入肉块翻炒上色', '加入调料和水炖煮', '大火收汁即可'],
  },
  {
    id: '2', name: '番茄炒蛋', cooking_time: 15, servings: 2,
    ingredients: [
      { name: '番茄', quantity: 2, unit: '个' },
      { name: '鸡蛋', quantity: 3, unit: '个' },
      { name: '食用油', quantity: 20, unit: '毫升' },
      { name: '盐', quantity: 3, unit: '克' },
      { name: '白糖', quantity: 5, unit: '克' },
    ],
    steps: ['番茄切块，鸡蛋打散', '炒鸡蛋盛出备用', '炒番茄出汁', '加入鸡蛋翻炒调味'],
  },
  {
    id: '3', name: '清炒时蔬', cooking_time: 10, servings: 2,
    ingredients: [
      { name: '青菜', quantity: 300, unit: '克' },
      { name: '蒜末', quantity: 2, unit: '勺' },
      { name: '盐', quantity: 3, unit: '克' },
    ],
    steps: ['青菜洗净沥干', '热油爆香蒜末', '下青菜快炒', '加盐调味出锅'],
  },
  {
    id: '4', name: '麻婆豆腐', cooking_time: 20, servings: 2,
    ingredients: [
      { name: '嫩豆腐', quantity: 1, unit: '块' },
      { name: '猪肉末', quantity: 100, unit: '克' },
      { name: '豆瓣酱', quantity: 15, unit: '克' },
      { name: '花椒粉', quantity: 2, unit: '克' },
      { name: '葱花', quantity: '适量', unit: '克' },
      { name: '淀粉', quantity: 5, unit: '克' },
    ],
    steps: ['豆腐切块焯水', '炒肉末盛出', '爆香蒜末加豆瓣酱', '加水和豆腐煮5分钟', '勾芡撒花椒粉出锅'],
  },
  {
    id: '5', name: '蒜蓉西兰花', cooking_time: 10, servings: 2,
    ingredients: [
      { name: '西兰花', quantity: 1, unit: '颗' },
      { name: '大蒜', quantity: 5, unit: '瓣' },
      { name: '食用油', quantity: 15, unit: '毫升' },
      { name: '盐', quantity: 2, unit: '克' },
    ],
    steps: ['西兰花切小朵浸泡', '大蒜切末', '西兰花焯水1分钟', '爆香蒜末翻炒', '加盐调味出锅'],
  },
];

const mockInventory: InventoryItem[] = [
  { id: 'inv1', name: '鸡蛋', quantity: 10, unit: '个', last_updated: '2026-06-20' },
  { id: 'inv2', name: '盐', quantity: 500, unit: '克', last_updated: '2026-06-15' },
  { id: 'inv3', name: '生抽', quantity: 300, unit: '毫升', last_updated: '2026-06-18' },
  { id: 'inv4', name: '食用油', quantity: 1000, unit: '毫升', last_updated: '2026-06-10' },
  { id: 'inv5', name: '白糖', quantity: 300, unit: '克', last_updated: '2026-06-12' },
];

export const useAppStore = create<AppState>((set, get) => ({
  recipes: mockRecipes,
  inventory: mockInventory,
  shoppingList: [],
  selectedRecipeIds: [],
  searchQuery: '',
  sortOrder: null,
  ingredientNames: [],
  loading: false,
  _recipesCacheTime: 0,
  _inventoryCacheTime: 0,
  _ingredientNamesCacheTime: 0,
  CACHE_TTL: 5000,

  setRecipes: (recipes) => set({ recipes, _recipesCacheTime: Date.now() }),
  addRecipe: (recipe) => set((state) => ({ recipes: [...state.recipes, recipe] })),
  updateRecipe: (recipe) => set((state) => ({
    recipes: state.recipes.map((r) => (r.id === recipe.id ? recipe : r)),
  })),
  deleteRecipe: (id) => set((state) => ({
    recipes: state.recipes.filter((r) => r.id !== id),
    selectedRecipeIds: state.selectedRecipeIds.filter((rid) => rid !== id),
  })),
  getRecipeById: (id) => get().recipes.find((r) => r.id === id),

  setInventory: (inventory) => set({ inventory, _inventoryCacheTime: Date.now() }),
  addInventoryItem: (item) => set((state) => ({ inventory: [...state.inventory, item] })),
  updateInventoryItem: (item) => set((state) => ({
    inventory: state.inventory.map((i) => (i.id === item.id ? item : i)),
  })),
  deleteInventoryItem: (id) => set((state) => ({
    inventory: state.inventory.filter((i) => i.id !== id),
  })),

  setShoppingList: (list) => set({ shoppingList: list }),
  updateShoppingListItem: (id, updates) => set((state) => ({
    shoppingList: state.shoppingList.map((i) => (i.id === id ? { ...i, ...updates } : i)),
  })),
  removeShoppingListItem: (id) => set((state) => ({
    shoppingList: state.shoppingList.filter((i) => i.id !== id),
  })),

  toggleRecipeSelection: (id) => set((state) => ({
    selectedRecipeIds: state.selectedRecipeIds.includes(id)
      ? state.selectedRecipeIds.filter((rid) => rid !== id)
      : [...state.selectedRecipeIds, id],
  })),
  clearSelection: () => set({ selectedRecipeIds: [] }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortOrder: (order) => set({ sortOrder: order }),

  fetchRecipes: async (force = false) => {
    const state = get();
    if (!force && state._recipesCacheTime > 0 && Date.now() - state._recipesCacheTime < state.CACHE_TTL) {
      return;
    }
    set({ loading: true });
    try {
      const recipes = await api.getRecipes();
      const mapped = recipes.map((r: any) => ({
        id: String(r.id),
        name: r.name,
        cooking_time: r.cooking_time || r.cookingTime,
        ingredients: (r.ingredients || []).map((i: any) => ({
          id: String(i.id),
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          category: i.category,
        })),
        steps: r.steps || [],
        servings: r.servings || 2,
        image_data: r.image_data || r.image,
      }));
      set({ recipes: mapped, _recipesCacheTime: Date.now(), loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchInventory: async (force = false) => {
    const state = get();
    if (!force && state._inventoryCacheTime > 0 && Date.now() - state._inventoryCacheTime < state.CACHE_TTL) {
      return;
    }
    try {
      const inventory = await api.getInventory();
      const mapped = inventory.map((i: any) => ({
        id: String(i.id),
        name: i.name,
        quantity: typeof i.quantity === 'string' ? Number(i.quantity) : i.quantity,
        unit: i.unit,
        last_updated: i.last_updated || i.lastUpdated || new Date().toISOString().split('T')[0],
      }));
      set({ inventory: mapped, _inventoryCacheTime: Date.now() });
    } catch {
    }
  },

  fetchIngredientNames: async (force = false) => {
    const state = get();
    if (!force && state._ingredientNamesCacheTime > 0 && Date.now() - state._ingredientNamesCacheTime < state.CACHE_TTL) {
      return;
    }
    try {
      const names = await api.getIngredientNames();
      set({ ingredientNames: names, _ingredientNamesCacheTime: Date.now() });
    } catch {
      set({ ingredientNames: get().getAllIngredientNames(), _ingredientNamesCacheTime: Date.now() });
    }
  },

  generateShoppingList: (scaledIngredientsMap?: Map<string, {quantity: number, unit: string, name: string}[]>) => {
    const state = get();
    const selectedRecipes = state.recipes.filter((r) => state.selectedRecipeIds.includes(r.id));

    const mergedIngredients = new Map<string, { name: string; quantity: number; unit: string }>();

    selectedRecipes.forEach((recipe) => {
      let ingredientsToProcess = recipe.ingredients;

      if (scaledIngredientsMap && scaledIngredientsMap.has(recipe.id)) {
        const scaled = scaledIngredientsMap.get(recipe.id)!;
        ingredientsToProcess = scaled.map(s => ({
          name: s.name,
          quantity: s.quantity,
          unit: s.unit,
        }));
      }

      ingredientsToProcess.forEach((ing) => {
        const qty = isNumericQuantity(ing.quantity) ? toNumericQuantity(ing.quantity) : 0;
        if (qty <= 0 && !isNumericQuantity(ing.quantity)) return;
        const key = `${ing.name}-${ing.unit}`;
        if (mergedIngredients.has(key)) {
          const existing = mergedIngredients.get(key)!;
          existing.quantity += qty;
        } else {
          mergedIngredients.set(key, { name: ing.name, quantity: qty, unit: ing.unit });
        }
      });
    });

    const shoppingList: ShoppingListItem[] = [];
    mergedIngredients.forEach((value, key) => {
      const inventoryItem = state.inventory.find((i) => i.name === value.name && i.unit === value.unit);
      const inventoryQty = inventoryItem?.quantity || 0;
      const neededQty = Math.max(0, value.quantity - inventoryQty);

      if (neededQty > 0) {
        shoppingList.push({
          id: `sl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: value.name,
          quantity: Math.round(neededQty * 100) / 100,
          unit: value.unit,
          category: categorizeIngredient(value.name),
          checked: false,
        });
      }
    });

    set({ shoppingList });
  },

  getAllIngredientNames: () => {
    const state = get();
    const names = new Set<string>();
    state.recipes.forEach((recipe) => {
      recipe.ingredients.forEach((ing) => names.add(ing.name));
    });
    state.inventory.forEach((item) => names.add(item.name));
    return Array.from(names);
  },
}));
