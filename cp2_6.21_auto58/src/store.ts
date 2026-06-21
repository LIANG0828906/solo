import { create } from 'zustand';
import { Recipe, InventoryItem, ShoppingListItem, Ingredient, SortOrder } from './types';

interface AppState {
  recipes: Recipe[];
  inventory: InventoryItem[];
  shoppingList: ShoppingListItem[];
  selectedRecipeIds: string[];
  searchQuery: string;
  sortOrder: SortOrder;
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
  addShoppingListItem: (item: ShoppingListItem) => void;
  updateShoppingListItem: (item: ShoppingListItem) => void;
  removeShoppingListItem: (id: string) => void;
  toggleRecipeSelection: (id: string) => void;
  clearSelection: () => void;
  setSearchQuery: (query: string) => void;
  setSortOrder: (order: SortOrder) => void;
  generateShoppingList: () => void;
  getAllIngredientNames: () => string[];
}

const categorizeIngredient = (name: string): ShoppingListItem['category'] => {
  const vegetableKeywords = ['菜', '茄', '椒', '瓜', '葱', '蒜', '姜', '萝卜', '白菜', '菠菜', '芹菜', '韭菜', '洋葱', '番茄', '土豆', '黄瓜', '茄子', '辣椒', '南瓜', '冬瓜'];
  const meatKeywords = ['肉', '鸡', '鸭', '鱼', '虾', '蟹', '牛', '猪', '羊', '蛋', '排骨', '火腿', '香肠', '培根'];
  const seasoningKeywords = ['盐', '糖', '油', '酱', '醋', '酒', '椒', '香', '料', '精', '粉', '蜜', '奶', '油'];

  if (vegetableKeywords.some(k => name.includes(k))) return '蔬菜';
  if (meatKeywords.some(k => name.includes(k))) return '肉类';
  if (seasoningKeywords.some(k => name.includes(k))) return '调味料';
  return '其他';
};

const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: '红烧肉',
    cooking_time: 60,
    ingredients: [
      { name: '五花肉', quantity: 500, unit: '克' },
      { name: '生抽', quantity: 2, unit: '汤匙' },
      { name: '老抽', quantity: 1, unit: '汤匙' },
      { name: '冰糖', quantity: 30, unit: '克' },
      { name: '料酒', quantity: 2, unit: '汤匙' },
      { name: '姜片', quantity: 3, unit: '片' },
    ],
    steps: ['五花肉切块焯水', '锅中放糖炒出糖色', '放入肉块翻炒上色', '加入调料和水炖煮', '大火收汁即可'],
    servings: 2,
  },
  {
    id: '2',
    name: '西红柿炒鸡蛋',
    cooking_time: 15,
    ingredients: [
      { name: '番茄', quantity: 2, unit: '个' },
      { name: '鸡蛋', quantity: 3, unit: '个' },
      { name: '葱花', quantity: 1, unit: '把' },
      { name: '盐', quantity: 5, unit: '克' },
      { name: '白糖', quantity: 10, unit: '克' },
    ],
    steps: ['番茄切块，鸡蛋打散', '炒鸡蛋盛出备用', '炒番茄出汁', '加入鸡蛋翻炒调味'],
    servings: 2,
  },
  {
    id: '3',
    name: '清炒时蔬',
    cooking_time: 10,
    ingredients: [
      { name: '青菜', quantity: 300, unit: '克' },
      { name: '蒜末', quantity: 2, unit: '勺' },
      { name: '盐', quantity: 3, unit: '克' },
    ],
    steps: ['青菜洗净沥干', '热油爆香蒜末', '下青菜快炒', '加盐调味出锅'],
    servings: 2,
  },
];

const mockInventory: InventoryItem[] = [
  { id: 'inv1', name: '鸡蛋', quantity: 10, unit: '个', last_updated: '2026-06-20' },
  { id: 'inv2', name: '盐', quantity: 500, unit: '克', last_updated: '2026-06-15' },
  { id: 'inv3', name: '生抽', quantity: 300, unit: '毫升', last_updated: '2026-06-18' },
];

export const useAppStore = create<AppState>((set, get) => ({
  recipes: mockRecipes,
  inventory: mockInventory,
  shoppingList: [],
  selectedRecipeIds: [],
  searchQuery: '',
  sortOrder: null,

  setRecipes: (recipes) => set({ recipes }),
  addRecipe: (recipe) => set((state) => ({ recipes: [...state.recipes, recipe] })),
  updateRecipe: (recipe) => set((state) => ({
    recipes: state.recipes.map((r) => (r.id === recipe.id ? recipe : r)),
  })),
  deleteRecipe: (id) => set((state) => ({
    recipes: state.recipes.filter((r) => r.id !== id),
    selectedRecipeIds: state.selectedRecipeIds.filter((rid) => rid !== id),
  })),
  getRecipeById: (id) => get().recipes.find((r) => r.id === id),

  setInventory: (inventory) => set({ inventory }),
  addInventoryItem: (item) => set((state) => ({ inventory: [...state.inventory, item] })),
  updateInventoryItem: (item) => set((state) => ({
    inventory: state.inventory.map((i) => (i.id === item.id ? item : i)),
  })),
  deleteInventoryItem: (id) => set((state) => ({
    inventory: state.inventory.filter((i) => i.id !== id),
  })),

  setShoppingList: (list) => set({ shoppingList: list }),
  addShoppingListItem: (item) => set((state) => ({ shoppingList: [...state.shoppingList, item] })),
  updateShoppingListItem: (item) => set((state) => ({
    shoppingList: state.shoppingList.map((i) => (i.id === item.id ? item : i)),
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

  generateShoppingList: () => {
    const state = get();
    const selectedRecipes = state.recipes.filter((r) => state.selectedRecipeIds.includes(r.id));

    const mergedIngredients = new Map<string, { quantity: number; unit: string }>();
    selectedRecipes.forEach((recipe) => {
      recipe.ingredients.forEach((ing) => {
        const key = `${ing.name}-${ing.unit}`;
        if (mergedIngredients.has(key)) {
          const existing = mergedIngredients.get(key)!;
          existing.quantity += ing.quantity;
        } else {
          mergedIngredients.set(key, { quantity: ing.quantity, unit: ing.unit });
        }
      });
    });

    const shoppingList: ShoppingListItem[] = [];
    mergedIngredients.forEach((value, key) => {
      const [name] = key.split('-');
      const inventoryItem = state.inventory.find((i) => i.name === name && i.unit === value.unit);
      const inventoryQty = inventoryItem?.quantity || 0;
      const neededQty = Math.max(0, value.quantity - inventoryQty);

      if (neededQty > 0) {
        shoppingList.push({
          id: `sl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          quantity: neededQty,
          unit: value.unit,
          category: categorizeIngredient(name),
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
