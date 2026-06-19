export type MaterialCategory = 'tea' | 'topping' | 'syrup';

export type TeaSubCategory = 'original' | 'flower' | 'milk';

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  subCategory?: TeaSubCategory;
  color: string;
  calories: number;
  description: string;
  icon: string;
}

export interface SelectedMaterial extends Material {
  instanceId: string;
  order: number;
}

export interface Recommendation {
  id: string;
  materialId: string;
  reason: string;
  type: 'topping' | 'syrup' | 'tea';
}

export interface RecipeCard {
  id: string;
  name: string;
  materials: SelectedMaterial[];
  totalCalories: number;
  servingTemperature: string;
  createdAt: number;
}

export interface TeaStore {
  materials: Material[];
  selectedMaterials: SelectedMaterial[];
  recommendations: Recommendation[];
  searchQuery: string;
  activeCategory: TeaSubCategory | 'all';
  currentRecipe: RecipeCard | null;
  isCardGenerating: boolean;
  showWorkbench: boolean;
  newlyAddedInstanceId: string | null;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (category: TeaSubCategory | 'all') => void;
  addMaterial: (materialId: string) => void;
  removeMaterial: (instanceId: string) => void;
  reorderMaterials: (fromIndex: number, toIndex: number) => void;
  generateRecommendations: () => void;
  generateRecipeCard: (name: string) => void;
  toggleWorkbench: () => void;
  setCardGenerating: (status: boolean) => void;
  clearNewlyAdded: () => void;
}
