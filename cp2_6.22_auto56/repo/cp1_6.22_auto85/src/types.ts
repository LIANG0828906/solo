export interface Recipe {
  id: string;
  name: string;
  image: string;
  cookTime: string;
  tags: string[];
  ingredients: { name: string; quantity: string }[];
  steps: string[];
  rating: number;
  reviewCount: number;
}

export interface Comment {
  id: string;
  recipeId: string;
  username: string;
  content: string;
  rating: number;
  createdAt: number;
}

export interface AppState {
  recipes: Recipe[];
  recommendedRecipes: Recipe[];
  favorites: string[];
  searchQuery: string;
  selectedTags: string[];
  currentView: 'list' | 'detail';
  selectedRecipe: Recipe | null;
  showFavoritesDrawer: boolean;
  comments: Record<string, Comment[]>;
  isRecommendLoading: boolean;
}

export type Action =
  | { type: 'SET_RECIPES'; payload: Recipe[] }
  | { type: 'SET_RECOMMENDED'; payload: Recipe[] }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'TOGGLE_TAG'; payload: string }
  | { type: 'SHOW_DETAIL'; payload: Recipe }
  | { type: 'SHOW_LIST' }
  | { type: 'TOGGLE_FAVORITES_DRAWER' }
  | { type: 'ADD_COMMENT'; payload: { recipeId: string; comment: Comment } }
  | { type: 'SET_COMMENTS'; payload: { recipeId: string; comments: Comment[] } }
  | { type: 'SET_RECOMMEND_LOADING'; payload: boolean };

export const ALL_TAGS = ['素食', '低卡', '高蛋白', '快手', '甜点', '中餐', '西餐', '健康', '辣', '清淡'];

export const RANDOM_USERNAMES = [
  '美食家小王', '吃货一枚', '厨房小白', '烘焙达人', '家常菜高手',
  '减脂餐博主', '甜品控', '川菜爱好者', '健康饮食家', '新手厨师',
  '老饕客', '料理初心者', '美食探索者', '家常菜妈妈', '健身餐达人'
];
