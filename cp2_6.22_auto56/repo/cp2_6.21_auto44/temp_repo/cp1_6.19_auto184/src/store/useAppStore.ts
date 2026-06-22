import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Recipe, GroceryItem, Collaborator, Ingredient } from '@/types';
import { parseRecipesToGroceryList } from '@/utils/recipeParser';

const mockIngredients: Ingredient[] = [
  { id: uuidv4(), name: '西红柿', quantity: 2, unit: '个', category: 'vegetables' },
  { id: uuidv4(), name: '鸡蛋', quantity: 3, unit: '个', category: 'meat' },
  { id: uuidv4(), name: '葱花', quantity: 5, unit: 'g', category: 'vegetables' },
  { id: uuidv4(), name: '盐', quantity: 2, unit: 'g', category: 'seasoning' },
  { id: uuidv4(), name: '白糖', quantity: 3, unit: 'g', category: 'seasoning' },
];

const mockRecipes: Recipe[] = [
  {
    id: uuidv4(),
    name: '番茄炒蛋',
    coverColor: '#FF6B6B',
    ingredients: mockIngredients,
    steps: [
      '西红柿切块，鸡蛋打散',
      '热锅凉油，倒入蛋液炒至金黄盛出',
      '锅中加油，放入西红柿翻炒出汁',
      '加入盐、糖调味',
      '倒入炒好的鸡蛋翻炒均匀',
      '撒上葱花出锅',
    ],
    createdAt: new Date(),
  },
  {
    id: uuidv4(),
    name: '红烧肉',
    coverColor: '#C44536',
    ingredients: [
      { id: uuidv4(), name: '五花肉', quantity: 500, unit: 'g', category: 'meat' },
      { id: uuidv4(), name: '冰糖', quantity: 30, unit: 'g', category: 'seasoning' },
      { id: uuidv4(), name: '生抽', quantity: 2, unit: '勺', category: 'seasoning' },
      { id: uuidv4(), name: '老抽', quantity: 1, unit: '勺', category: 'seasoning' },
      { id: uuidv4(), name: '料酒', quantity: 2, unit: '勺', category: 'seasoning' },
      { id: uuidv4(), name: '八角', quantity: 2, unit: '个', category: 'seasoning' },
      { id: uuidv4(), name: '桂皮', quantity: 1, unit: '块', category: 'seasoning' },
      { id: uuidv4(), name: '姜片', quantity: 5, unit: '片', category: 'vegetables' },
      { id: uuidv4(), name: '葱段', quantity: 3, unit: '段', category: 'vegetables' },
    ],
    steps: [
      '五花肉切块，冷水下锅焯水',
      '锅中放少许油，加入冰糖炒糖色',
      '糖色炒至枣红色，倒入五花肉翻炒',
      '加入生抽、老抽、料酒调味',
      '加入八角、桂皮、姜片、葱段',
      '加开水没过肉，大火烧开转小火炖1小时',
      '大火收汁即可',
    ],
    createdAt: new Date(),
  },
  {
    id: uuidv4(),
    name: '清炒时蔬',
    coverColor: '#2ECC71',
    ingredients: [
      { id: uuidv4(), name: '白菜', quantity: 300, unit: 'g', category: 'vegetables' },
      { id: uuidv4(), name: '胡萝卜', quantity: 50, unit: 'g', category: 'vegetables' },
      { id: uuidv4(), name: '木耳', quantity: 20, unit: 'g', category: 'vegetables' },
      { id: uuidv4(), name: '蒜片', quantity: 3, unit: '片', category: 'vegetables' },
      { id: uuidv4(), name: '盐', quantity: 2, unit: 'g', category: 'seasoning' },
      { id: uuidv4(), name: '生抽', quantity: 1, unit: '勺', category: 'seasoning' },
    ],
    steps: [
      '白菜切段，胡萝卜切片，木耳泡发',
      '锅中水烧开，放入蔬菜焯水30秒',
      '热锅凉油，爆香蒜片',
      '倒入所有蔬菜大火快炒',
      '加盐、生抽调味，翻炒均匀出锅',
    ],
    createdAt: new Date(),
  },
  {
    id: uuidv4(),
    name: '宫保鸡丁',
    coverColor: '#E67E22',
    ingredients: [
      { id: uuidv4(), name: '鸡胸肉', quantity: 300, unit: 'g', category: 'meat' },
      { id: uuidv4(), name: '花生米', quantity: 50, unit: 'g', category: 'drygoods' },
      { id: uuidv4(), name: '干辣椒', quantity: 10, unit: '个', category: 'seasoning' },
      { id: uuidv4(), name: '花椒', quantity: 1, unit: '勺', category: 'seasoning' },
      { id: uuidv4(), name: '葱白', quantity: 3, unit: '段', category: 'vegetables' },
      { id: uuidv4(), name: '姜末', quantity: 5, unit: 'g', category: 'vegetables' },
      { id: uuidv4(), name: '蒜片', quantity: 5, unit: '片', category: 'vegetables' },
      { id: uuidv4(), name: '生抽', quantity: 2, unit: '勺', category: 'seasoning' },
      { id: uuidv4(), name: '醋', quantity: 1, unit: '勺', category: 'seasoning' },
      { id: uuidv4(), name: '白糖', quantity: 2, unit: '勺', category: 'seasoning' },
      { id: uuidv4(), name: '淀粉', quantity: 1, unit: '勺', category: 'drygoods' },
    ],
    steps: [
      '鸡胸肉切丁，加盐、料酒、淀粉腌制15分钟',
      '花生米炸至金黄酥脆备用',
      '调制宫保汁：生抽、醋、白糖、淀粉、少许水',
      '热锅凉油，爆香花椒、干辣椒',
      '倒入鸡丁滑炒至变色',
      '加入葱姜蒜翻炒出香',
      '倒入宫保汁翻炒均匀',
      '最后加入花生米快速翻炒出锅',
    ],
    createdAt: new Date(),
  },
  {
    id: uuidv4(),
    name: '紫菜蛋花汤',
    coverColor: '#7D6608',
    ingredients: [
      { id: uuidv4(), name: '紫菜', quantity: 5, unit: 'g', category: 'vegetables' },
      { id: uuidv4(), name: '鸡蛋', quantity: 2, unit: '个', category: 'meat' },
      { id: uuidv4(), name: '葱花', quantity: 5, unit: 'g', category: 'vegetables' },
      { id: uuidv4(), name: '盐', quantity: 2, unit: 'g', category: 'seasoning' },
      { id: uuidv4(), name: '香油', quantity: 1, unit: '勺', category: 'seasoning' },
      { id: uuidv4(), name: '虾皮', quantity: 10, unit: 'g', category: 'meat' },
    ],
    steps: [
      '紫菜撕成小块，鸡蛋打散',
      '锅中加水烧开，放入紫菜、虾皮',
      '水再次烧开后，缓慢倒入蛋液形成蛋花',
      '加盐调味，撒上葱花',
      '淋入香油即可出锅',
    ],
    createdAt: new Date(),
  },
];

const mockCollaborators: Collaborator[] = [
  { id: '1', name: '妈妈', color: '#E74C3C', online: true },
  { id: '2', name: '爸爸', color: '#3498DB', online: true },
  { id: '3', name: '小明', color: '#2ECC71', online: false },
  { id: '4', name: '小红', color: '#F39C12', online: true },
];

interface AppState {
  recipes: Recipe[];
  selectedRecipeIds: string[];
  groceryItems: GroceryItem[];
  collaborators: Collaborator[];
  currentUserId: string;
  searchQuery: string;
  activeModule: 'recipes' | 'shopping';
  selectedRecipeId: string | null;
  
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  
  toggleRecipeSelection: (recipeId: string) => void;
  toggleGroceryItem: (itemId: string) => void;
  addGroceryItem: (item: Omit<GroceryItem, 'id'>) => void;
  removeGroceryItem: (itemId: string) => void;
  generateShoppingList: () => void;
  
  setSearchQuery: (query: string) => void;
  setActiveModule: (module: 'recipes' | 'shopping') => void;
  setSelectedRecipeId: (id: string | null) => void;
  
  simulateCollaboratorUpdate: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  recipes: mockRecipes,
  selectedRecipeIds: [],
  groceryItems: [],
  collaborators: mockCollaborators,
  currentUserId: '1',
  searchQuery: '',
  activeModule: 'recipes',
  selectedRecipeId: null,
  
  addRecipe: (recipe) => set((state) => ({
    recipes: [
      ...state.recipes,
      { ...recipe, id: uuidv4(), createdAt: new Date() },
    ],
  })),
  
  updateRecipe: (id, recipe) => set((state) => ({
    recipes: state.recipes.map(r => 
      r.id === id ? { ...r, ...recipe } : r
    ),
  })),
  
  deleteRecipe: (id) => set((state) => ({
    recipes: state.recipes.filter(r => r.id !== id),
    selectedRecipeIds: state.selectedRecipeIds.filter(rid => rid !== id),
    selectedRecipeId: state.selectedRecipeId === id ? null : state.selectedRecipeId,
  })),
  
  toggleRecipeSelection: (recipeId) => set((state) => {
    const isSelected = state.selectedRecipeIds.includes(recipeId);
    const newSelectedIds = isSelected
      ? state.selectedRecipeIds.filter(id => id !== recipeId)
      : [...state.selectedRecipeIds, recipeId];
    
    const selectedRecipes = state.recipes.filter(r => newSelectedIds.includes(r.id));
    const groceryItems = parseRecipesToGroceryList(selectedRecipes);
    
    return {
      selectedRecipeIds: newSelectedIds,
      groceryItems,
    };
  }),
  
  toggleGroceryItem: (itemId) => set((state) => ({
    groceryItems: state.groceryItems.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ),
  })),
  
  addGroceryItem: (item) => set((state) => ({
    groceryItems: [...state.groceryItems, { ...item, id: uuidv4() }],
  })),
  
  removeGroceryItem: (itemId) => set((state) => ({
    groceryItems: state.groceryItems.filter(item => item.id !== itemId),
  })),
  
  generateShoppingList: () => {
    const { recipes, selectedRecipeIds } = get();
    const selectedRecipes = recipes.filter(r => selectedRecipeIds.includes(r.id));
    const groceryItems = parseRecipesToGroceryList(selectedRecipes);
    set({ groceryItems });
  },
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setActiveModule: (module) => set({ activeModule: module }),
  
  setSelectedRecipeId: (id) => set({ selectedRecipeId: id }),
  
  simulateCollaboratorUpdate: () => set((state) => {
    if (state.groceryItems.length === 0) return state;
    
    const randomIndex = Math.floor(Math.random() * state.groceryItems.length);
    const newItems = [...state.groceryItems];
    newItems[randomIndex] = {
      ...newItems[randomIndex],
      checked: !newItems[randomIndex].checked,
    };
    
    return { groceryItems: newItems };
  }),
}));
