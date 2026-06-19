import { create } from 'zustand';
import { GameStore, Material, SynthesisResult, Recipe } from './types';
import { RECIPES, INITIAL_UNLOCKED_RECIPES } from './data/recipes';

const INITIAL_MATERIALS = 10;

const getInitialMaterials = (): Record<Material, number> => ({
  [Material.Mercury]: INITIAL_MATERIALS,
  [Material.Sulfur]: INITIAL_MATERIALS,
  [Material.Salt]: INITIAL_MATERIALS,
  [Material.Moonstone]: INITIAL_MATERIALS,
  [Material.Firewort]: INITIAL_MATERIALS,
});

const findMatchingRecipe = (materials: Material[]): Recipe | null => {
  const sortedMaterials = [...materials].sort();
  for (const recipe of RECIPES) {
    const sortedRecipeMaterials = [...recipe.materials].sort();
    if (
      sortedMaterials.length === sortedRecipeMaterials.length &&
      sortedMaterials.every((m, i) => m === sortedRecipeMaterials[i])
    ) {
      return recipe;
    }
  }
  return null;
};

const calculateSuccessRate = (
  recipe: Recipe,
  temperature: number,
  stirSpeed: number
): number => {
  let chance = 80;

  const avgTemp = (recipe.optimalTemp.min + recipe.optimalTemp.max) / 2;
  const tempDiff = Math.abs(temperature - avgTemp);
  const tempPenalty = Math.floor(tempDiff / 10) * 5;
  chance -= tempPenalty;

  const avgStir = (recipe.optimalStir.min + recipe.optimalStir.max) / 2;
  const stirDiff = Math.abs(stirSpeed - avgStir);
  const stirPenalty = stirDiff * 10;
  chance -= stirPenalty;

  return Math.max(0, Math.min(100, chance));
};

export const useGameStore = create<GameStore>((set, get) => ({
  materials: getInitialMaterials(),
  unlockedRecipes: [...INITIAL_UNLOCKED_RECIPES],
  cauldronMaterials: [],
  temperature: 100,
  stirSpeed: 5,
  successChance: 0,
  synthesisResult: null,
  isSynthesizing: false,
  showRecipeBook: false,
  currentPage: 0,
  successfulSynthesisCount: 0,
  newlyUnlockedRecipe: null,

  addMaterialToCauldron: (material: Material) => {
    const state = get();
    if (state.materials[material] <= 0) return;
    if (state.cauldronMaterials.length >= 5) return;

    set((prev) => {
      const newCauldronMaterials = [...prev.cauldronMaterials, material];
      const recipe = findMatchingRecipe(newCauldronMaterials);
      const newChance = recipe
        ? calculateSuccessRate(recipe, prev.temperature, prev.stirSpeed)
        : 0;

      return {
        cauldronMaterials: newCauldronMaterials,
        successChance: newChance,
      };
    });
  },

  removeMaterialFromCauldron: (index: number) => {
    set((prev) => {
      const newCauldronMaterials = prev.cauldronMaterials.filter((_, i) => i !== index);
      const recipe = findMatchingRecipe(newCauldronMaterials);
      const newChance = recipe
        ? calculateSuccessRate(recipe, prev.temperature, prev.stirSpeed)
        : 0;

      return {
        cauldronMaterials: newCauldronMaterials,
        successChance: newChance,
      };
    });
  },

  setTemperature: (temp: number) => {
    set((prev) => {
      const recipe = findMatchingRecipe(prev.cauldronMaterials);
      const newChance = recipe
        ? calculateSuccessRate(recipe, temp, prev.stirSpeed)
        : 0;

      return {
        temperature: temp,
        successChance: newChance,
      };
    });
  },

  setStirSpeed: (speed: number) => {
    set((prev) => {
      const recipe = findMatchingRecipe(prev.cauldronMaterials);
      const newChance = recipe
        ? calculateSuccessRate(recipe, prev.temperature, speed)
        : 0;

      return {
        stirSpeed: speed,
        successChance: newChance,
      };
    });
  },

  calculateSuccessChance: () => {
    const state = get();
    const recipe = findMatchingRecipe(state.cauldronMaterials);
    if (!recipe) {
      set({ successChance: 0 });
      return;
    }
    const chance = calculateSuccessRate(recipe, state.temperature, state.stirSpeed);
    set({ successChance: chance });
  },

  startSynthesis: () => {
    const state = get();
    if (state.isSynthesizing) return;
    if (state.cauldronMaterials.length < 2) return;

    set({ isSynthesizing: true });

    const recipe = findMatchingRecipe(state.cauldronMaterials);
    const chance = recipe
      ? calculateSuccessRate(recipe, state.temperature, state.stirSpeed)
      : 0;

    const materialsInCauldron = [...state.cauldronMaterials];

    setTimeout(() => {
      const currentState = get();
      const isSuccess = Math.random() * 100 < chance;
      const isKnownRecipe = recipe !== null;

      let result: SynthesisResult;
      let newMaterials = { ...currentState.materials };

      materialsInCauldron.forEach((mat) => {
        newMaterials[mat] = Math.max(0, newMaterials[mat] - 1);
      });

      if (isSuccess && isKnownRecipe && recipe) {
        result = {
          type: 'success',
          recipe,
          message: `合成成功！获得了 ${recipe.name}`,
        };

        const newCount = currentState.successfulSynthesisCount + 1;
        let newUnlocked = [...currentState.unlockedRecipes];
        let newlyUnlocked: Recipe | null = null;

        if (newCount % 3 === 0) {
          const lockedRecipes = RECIPES.filter(
            (r) => !newUnlocked.includes(r.id)
          );
          if (lockedRecipes.length > 0) {
            const randomRecipe =
              lockedRecipes[Math.floor(Math.random() * lockedRecipes.length)];
            newUnlocked.push(randomRecipe.id);
            newlyUnlocked = randomRecipe;
          }
        }

        set({
          synthesisResult: result,
          isSynthesizing: false,
          cauldronMaterials: [],
          successChance: 0,
          materials: newMaterials,
          successfulSynthesisCount: newCount,
          unlockedRecipes: newUnlocked,
          newlyUnlockedRecipe: newlyUnlocked,
        });
      } else if (!isKnownRecipe) {
        result = {
          type: 'sideEffect',
          message: '材料组合没有匹配的配方，生成了奇怪的副产品...',
        };
        set({
          synthesisResult: result,
          isSynthesizing: false,
          cauldronMaterials: [],
          successChance: 0,
          materials: newMaterials,
        });
      } else {
        result = {
          type: 'failure',
          message: '合成失败！发生了爆炸！',
        };
        set({
          synthesisResult: result,
          isSynthesizing: false,
          cauldronMaterials: [],
          successChance: 0,
          materials: newMaterials,
        });
      }
    }, 1500);
  },

  closeSynthesisResult: () => {
    set({ synthesisResult: null });
  },

  toggleRecipeBook: () => {
    set((prev) => ({ showRecipeBook: !prev.showRecipeBook }));
  },

  setCurrentPage: (page: number) => {
    set({ currentPage: page });
  },

  closeNewRecipe: () => {
    set({ newlyUnlockedRecipe: null });
  },
}));
