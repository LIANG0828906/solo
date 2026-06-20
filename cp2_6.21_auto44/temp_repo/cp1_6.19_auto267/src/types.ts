export enum Material {
  Mercury = 'mercury',
  Sulfur = 'sulfur',
  Salt = 'salt',
  Moonstone = 'moonstone',
  Firewort = 'firewort',
}

export interface MaterialInfo {
  name: string;
  color: string;
  gradient: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  materials: Material[];
  optimalTemp: { min: number; max: number };
  optimalStir: { min: number; max: number };
  potionColor: string;
  potionGradient: string;
  effect: string;
}

export type SynthesisResultType = 'success' | 'failure' | 'sideEffect';

export interface SynthesisResult {
  type: SynthesisResultType;
  recipe?: Recipe;
  message: string;
}

export interface GameState {
  materials: Record<Material, number>;
  unlockedRecipes: string[];
  cauldronMaterials: Material[];
  temperature: number;
  stirSpeed: number;
  successChance: number;
  synthesisResult: SynthesisResult | null;
  isSynthesizing: boolean;
  showRecipeBook: boolean;
  currentPage: number;
  successfulSynthesisCount: number;
  newlyUnlockedRecipe: Recipe | null;
}

export interface GameActions {
  addMaterialToCauldron: (material: Material) => void;
  removeMaterialFromCauldron: (index: number) => void;
  setTemperature: (temp: number) => void;
  setStirSpeed: (speed: number) => void;
  startSynthesis: () => void;
  closeSynthesisResult: () => void;
  toggleRecipeBook: () => void;
  setCurrentPage: (page: number) => void;
  closeNewRecipe: () => void;
  calculateSuccessChance: () => void;
}

export type GameStore = GameState & GameActions;
