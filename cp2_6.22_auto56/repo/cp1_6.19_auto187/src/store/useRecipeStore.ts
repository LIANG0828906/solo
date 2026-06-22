import { create } from 'zustand';
import { Recipe } from '../module1/types';

const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    name: '麻婆豆腐',
    ingredients: ['豆腐', '猪肉末', '豆瓣酱', '花椒', '葱', '姜', '蒜'],
    cookingMethod: '炒',
    flavorTags: ['spicy', 'savory'],
    rating: 4.8,
    likes: 256,
    description: '经典川菜，麻辣鲜香，嫩滑可口',
    steps: [
      '豆腐切块，用盐水浸泡5分钟',
      '锅中放油，炒香肉末',
      '加入豆瓣酱炒出红油',
      '加入豆腐和适量水',
      '勾芡撒花椒粉和葱花出锅',
    ],
    icon: 'chili',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: '2',
    name: '糖醋里脊',
    ingredients: ['猪里脊', '番茄酱', '白糖', '醋', '淀粉', '鸡蛋'],
    cookingMethod: '炸',
    flavorTags: ['sweet', 'sour'],
    rating: 4.6,
    likes: 189,
    description: '酸甜可口，外酥里嫩的经典家常菜',
    steps: [
      '里脊切条，腌制入味',
      '裹淀粉糊炸至金黄',
      '调糖醋汁煮开',
      '倒入炸好的里脊翻匀',
    ],
    icon: 'meat',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: '3',
    name: '凉拌黄瓜',
    ingredients: ['黄瓜', '蒜', '醋', '生抽', '香油', '盐'],
    cookingMethod: '凉拌',
    flavorTags: ['light', 'sour'],
    rating: 4.3,
    likes: 98,
    description: '清爽解腻，夏日必备小凉菜',
    steps: [
      '黄瓜拍碎切段',
      '加盐腌制10分钟挤干水分',
      '加入蒜末和调料',
      '淋香油拌匀即可',
    ],
    icon: 'vegetable',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: '4',
    name: '清蒸鲈鱼',
    ingredients: ['鲈鱼', '葱', '姜', '蒸鱼豉油', '料酒'],
    cookingMethod: '蒸',
    flavorTags: ['light', 'savory'],
    rating: 4.7,
    likes: 167,
    description: '鲜嫩滑口，原汁原味的健康蒸菜',
    steps: [
      '鲈鱼处理干净划几刀',
      '鱼身抹料酒放葱姜',
      '水开后蒸8分钟',
      '淋蒸鱼豉油和热油',
    ],
    icon: 'fish',
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: '5',
    name: '提拉米苏',
    ingredients: ['马斯卡彭奶酪', '手指饼干', '咖啡', '蛋黄', '糖', '可可粉'],
    cookingMethod: '凉拌',
    flavorTags: ['sweet'],
    rating: 4.9,
    likes: 342,
    description: '意式经典甜品，浓郁咖啡香与丝滑奶酪的完美结合',
    steps: [
      '蛋黄加糖打发',
      '加入马斯卡彭拌匀',
      '手指饼干蘸咖啡铺底',
      '一层奶酪一层饼干',
      '冷藏4小时撒可可粉',
    ],
    icon: 'dessert',
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    id: '6',
    name: '番茄炒蛋',
    ingredients: ['番茄', '鸡蛋', '葱', '糖', '盐'],
    cookingMethod: '炒',
    flavorTags: ['sour', 'light'],
    rating: 4.5,
    likes: 421,
    description: '国民家常菜，酸甜开胃，简单又美味',
    steps: [
      '鸡蛋打散炒盛出',
      '番茄切块炒出汁',
      '加少许糖和盐',
      '倒入鸡蛋翻匀撒葱花',
    ],
    icon: 'tomato',
    createdAt: Date.now() - 86400000 * 4,
  },
];

interface RecipeStore {
  recipes: Recipe[];
  selectedTags: string[];
  searchText: string;
  hoveredRecipeId: string | null;
  selectedRecipeId: string | null;
  isCreateModalOpen: boolean;
  isSidebarOpen: boolean;

  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void;
  toggleTag: (tag: string) => void;
  setSearchText: (text: string) => void;
  setHoveredRecipe: (id: string | null) => void;
  selectRecipe: (id: string | null) => void;
  toggleCreateModal: () => void;
  toggleSidebar: () => void;
  likeRecipe: (id: string) => void;
  getFilteredRecipes: () => Recipe[];
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipes: MOCK_RECIPES,
  selectedTags: [],
  searchText: '',
  hoveredRecipeId: null,
  selectedRecipeId: null,
  isCreateModalOpen: false,
  isSidebarOpen: true,

  addRecipe: (recipe) =>
    set((state) => ({
      recipes: [
        ...state.recipes,
        { ...recipe, id: String(Date.now()), createdAt: Date.now() },
      ],
      isCreateModalOpen: false,
    })),

  toggleTag: (tag) =>
    set((state) => ({
      selectedTags: state.selectedTags.includes(tag)
        ? state.selectedTags.filter((t) => t !== tag)
        : [...state.selectedTags, tag],
    })),

  setSearchText: (text) => set({ searchText: text }),

  setHoveredRecipe: (id) => set({ hoveredRecipeId: id }),

  selectRecipe: (id) => set({ selectedRecipeId: id }),

  toggleCreateModal: () => set((state) => ({ isCreateModalOpen: !state.isCreateModalOpen })),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  likeRecipe: (id) =>
    set((state) => ({
      recipes: state.recipes.map((r) =>
        r.id === id ? { ...r, likes: r.likes + 1 } : r
      ),
    })),

  getFilteredRecipes: () => {
    const { recipes, selectedTags, searchText } = get();
    return recipes.filter((recipe) => {
      if (
        selectedTags.length > 0 &&
        !selectedTags.some((tag) => recipe.flavorTags.includes(tag))
      ) {
        return false;
      }
      if (
        searchText.trim() &&
        !recipe.name.toLowerCase().includes(searchText.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  },
}));
