export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type Flavor = 'sour' | 'sweet' | 'bitter' | 'spicy' | 'salty' | 'umami';

export type IngredientCategory = 'protein' | 'vegetable' | 'seasoning' | 'grain' | 'other';

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  category: IngredientCategory;
  nutrition: Nutrition;
  flavors: Flavor[];
  pixelIcon: string;
}

export interface SynthesisItem {
  ingredient: Ingredient;
  quantity: number;
}

export interface RecipeScore {
  taste: number;
  nutrition: number;
  creativity: number;
  difficulty: number;
  appearance: number;
}

export interface SavedCard {
  id: string;
  name: string;
  items: SynthesisItem[];
  flavors: Flavor[];
  totalNutrition: Nutrition;
  score: RecipeScore;
  mainIngredient: Ingredient;
  createdAt: number;
}

export interface RecipeState {
  ingredients: Ingredient[];
  synthesisItems: SynthesisItem[];
  selectedFlavors: Flavor[];
  savedCards: SavedCard[];
  currentRecipeName: string;
  editingCardId: string | null;
}

export interface NutrientPercentages {
  protein: number;
  carbs: number;
  fat: number;
}

export interface RecipeStore extends RecipeState {
  addIngredient: (ingredient: Ingredient) => void;
  removeIngredient: (ingredientId: string) => void;
  updateQuantity: (ingredientId: string, quantity: number) => void;
  toggleFlavor: (flavor: Flavor) => void;
  setRecipeName: (name: string) => void;
  saveCard: () => void;
  loadCardForEdit: (cardId: string) => void;
  clearSynthesis: () => void;
  deleteCard: (cardId: string) => void;
  getTotalNutrition: () => Nutrition;
  getNutrientPercentages: () => NutrientPercentages;
  getMissingFlavors: () => Flavor[];
  getRecommendedSeasonings: () => Ingredient[];
  calculateScore: () => RecipeScore;
  getMainIngredient: () => Ingredient | null;
}

export const FLAVOR_LABELS: Record<Flavor, string> = {
  sour: '酸',
  sweet: '甜',
  bitter: '苦',
  spicy: '辣',
  salty: '咸',
  umami: '鲜',
};

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  protein: '蛋白质',
  vegetable: '蔬菜',
  seasoning: '调料',
  grain: '主食',
  other: '其他',
};
