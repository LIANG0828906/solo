export interface Material {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface Recipe {
  id: string;
  name: string;
  materials: string[];
  result: 'success' | 'failure';
  particleColor: string;
  energyLevel: number;
}

export interface CheckRecipeResult {
  matched: boolean;
  recipe?: Recipe;
}

class RecipeBook {
  private materials: Material[] = [];
  private recipes: Recipe[] = [];

  constructor() {
    this.initMaterials();
    this.initRecipes();
  }

  private initMaterials(): void {
    this.materials = [
      { id: 'sulfur', name: '硫磺', emoji: '🟡', color: '#FFD700' },
      { id: 'mercury', name: '水银', emoji: '⚪', color: '#C0C0C0' },
      { id: 'salt', name: '盐', emoji: '🧂', color: '#FFFFFF' },
      { id: 'herb', name: '草药', emoji: '🌿', color: '#2ECC71' },
      { id: 'crystal', name: '水晶', emoji: '💎', color: '#9B59B6' },
      { id: 'fire_essence', name: '火之精华', emoji: '🔥', color: '#E74C3C' },
      { id: 'water_essence', name: '水之精华', emoji: '💧', color: '#3498DB' },
      { id: 'earth_essence', name: '土之精华', emoji: '🪨', color: '#8B4513' },
      { id: 'air_essence', name: '风之精华', emoji: '💨', color: '#ECF0F1' },
      { id: 'gold_leaf', name: '金箔', emoji: '✨', color: '#F1C40F' },
      { id: 'moonstone', name: '月光石', emoji: '🌙', color: '#BDC3C7' },
      { id: 'phoenix_feather', name: '凤凰羽', emoji: '🪶', color: '#FF6B35' },
    ];
  }

  private initRecipes(): void {
    this.recipes = [
      {
        id: 'philosopher_stone',
        name: '贤者之石',
        materials: ['sulfur', 'mercury', 'gold_leaf'],
        result: 'success',
        particleColor: '#F1C40F',
        energyLevel: 100,
      },
      {
        id: 'healing_elixir',
        name: '治愈药剂',
        materials: ['herb', 'water_essence', 'crystal'],
        result: 'success',
        particleColor: '#2ECC71',
        energyLevel: 60,
      },
      {
        id: 'fire_potion',
        name: '烈焰药水',
        materials: ['fire_essence', 'sulfur', 'phoenix_feather'],
        result: 'success',
        particleColor: '#E74C3C',
        energyLevel: 80,
      },
      {
        id: 'frost_elixir',
        name: '寒霜秘药',
        materials: ['water_essence', 'moonstone', 'crystal'],
        result: 'success',
        particleColor: '#3498DB',
        energyLevel: 70,
      },
      {
        id: 'wind_charm',
        name: '风行护符',
        materials: ['air_essence', 'herb', 'moonstone'],
        result: 'success',
        particleColor: '#ECF0F1',
        energyLevel: 50,
      },
      {
        id: 'earth_ward',
        name: '大地守护',
        materials: ['earth_essence', 'salt', 'crystal'],
        result: 'success',
        particleColor: '#8B4513',
        energyLevel: 65,
      },
      {
        id: 'failed_explosion',
        name: '失败爆炸',
        materials: ['fire_essence', 'sulfur', 'salt'],
        result: 'failure',
        particleColor: '#555555',
        energyLevel: 20,
      },
      {
        id: 'failed_smoke',
        name: '失败烟雾',
        materials: ['herb', 'sulfur', 'mercury'],
        result: 'failure',
        particleColor: '#666666',
        energyLevel: 10,
      },
    ];
  }

  getMaterials(): Material[] {
    return [...this.materials];
  }

  getMaterialById(id: string): Material | undefined {
    return this.materials.find((m) => m.id === id);
  }

  getRecipes(): Recipe[] {
    return [...this.recipes];
  }

  checkRecipe(materialIds: string[]): CheckRecipeResult {
    if (materialIds.length < 2) {
      return { matched: false };
    }

    const sortedInput = [...materialIds].sort().join(',');

    for (const recipe of this.recipes) {
      const sortedRecipe = [...recipe.materials].sort().join(',');
      if (sortedInput === sortedRecipe) {
        return { matched: true, recipe };
      }
    }

    return { matched: false };
  }

  getRandomFailureRecipe(): Recipe {
    const failureRecipes = this.recipes.filter((r) => r.result === 'failure');
    return failureRecipes[Math.floor(Math.random() * failureRecipes.length)];
  }
}

export const recipeBook = new RecipeBook();
export default RecipeBook;
