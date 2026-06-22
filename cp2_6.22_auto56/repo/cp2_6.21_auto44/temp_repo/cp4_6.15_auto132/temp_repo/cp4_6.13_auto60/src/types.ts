export interface CoffeeBean {
  id: string;
  name: string;
  emoji: string;
  stockGrams: number;
  marketPrice: number;
  basePrice: number;
  flavorProfile: string;
  roastLevel: '浅度烘焙' | '中度烘焙' | '中深烘焙' | '深度烘焙';
  baseAcid: number;
  baseBitter: number;
  baseSweet: number;
}

export interface RecipeIngredient {
  beanId: string;
  grams: number;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  totalAcid: number;
  totalBitter: number;
  totalSweet: number;
  energyKcal: number;
  brewedCount: number;
}

export interface CustomerDemand {
  preferredBeans: string[];
  maxBitter?: number;
  minAcid?: number;
  minSweet?: number;
  keyword: string;
  description: string;
}

export type CustomerMood = 'happy' | 'neutral' | 'angry';
export type CustomerStatus = 'waiting' | 'served' | 'leaving' | 'complaining';

export interface Customer {
  id: string;
  emoji: string;
  mood: CustomerMood;
  demand: CustomerDemand;
  patience: number;
  hasComplaint: boolean;
  wrongAttempts: number;
  status: CustomerStatus;
  seatIndex: number;
  enteredAt: number;
}

export type GameMode = 'inventory' | 'recipe' | 'business';

export interface GameState {
  coins: number;
  satisfaction: number;
  businessTimeLeft: number;
  dayCount: number;
  isBusinessRunning: boolean;
  selectedRecipeId: string | null;
  beans: CoffeeBean[];
  recipes: Recipe[];
  customers: Customer[];
  complaintActive: boolean;
  complaintCustomerId: string | null;
  screenShake: boolean;
}

export interface GameActions {
  setModeAction: (noop: never) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'brewedCount'>) => void;
  incrementBrewedCount: (recipeId: string) => void;
  updateBeanStock: (beanId: string, delta: number) => void;
  fluctuateMarketPrices: () => void;
  selectRecipe: (recipeId: string | null) => void;
  generateCustomer: () => void;
  removeCustomer: (customerId: string) => void;
  serveCustomer: (customerId: string, recipeId: string) => { success: boolean; message: string };
  triggerComplaint: () => void;
  resolveComplaint: () => void;
  adjustSatisfaction: (delta: number) => void;
  startBusiness: () => void;
  tickBusiness: () => void;
  endBusiness: () => void;
  triggerScreenShake: () => void;
  resetWrongAttempts: (customerId: string) => void;
}

export type GameStore = GameState & GameActions;
