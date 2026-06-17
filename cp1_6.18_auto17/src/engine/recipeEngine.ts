import type { Recipe, RecommendationResult, Preferences, Ingredient } from '@/types';

const calculateMatchScore = (
  recipe: Recipe,
  selectedIngredients: Ingredient[],
  preferences: Preferences
): number => {
  const selectedNames = selectedIngredients.map(ing => ing.name);
  
  const matched = recipe.ingredients.filter(ri =>
    selectedNames.some(sn => ri.includes(sn) || sn.includes(ri))
  );
  
  let score = (matched.length / recipe.ingredients.length) * 100;
  
  if (preferences.dietType === 'vegetarian' && recipe.isVegetarian) {
    score *= 1.2;
  } else if (preferences.dietType === 'vegetarian' && !recipe.isVegetarian) {
    score *= 0.5;
  }
  
  if (preferences.dietType === 'lowCalorie' && recipe.calories < 400) {
    score *= 1.2;
  } else if (preferences.dietType === 'lowCalorie' && recipe.calories >= 500) {
    score *= 0.7;
  }
  
  if (preferences.dietType === 'highProtein' && recipe.protein > 30) {
    score *= 1.2;
  } else if (preferences.dietType === 'highProtein' && recipe.protein < 15) {
    score *= 0.7;
  }
  
  return Math.min(score, 100);
};

const hasAllergen = (recipe: Recipe, allergens: string[]): boolean => {
  return recipe.allergens.some(allergen => 
    allergens.some(userAllergen => 
      allergen.includes(userAllergen) || userAllergen.includes(allergen)
    )
  );
};

export const generateRecommendations = (
  recipes: Recipe[],
  selectedIngredients: Ingredient[],
  preferences: Preferences
): RecommendationResult[] => {
  const startTime = performance.now();
  
  const selectedNames = selectedIngredients.map(ing => ing.name);
  
  const results: RecommendationResult[] = [];
  
  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    
    if (preferences.allergens.length > 0 && hasAllergen(recipe, preferences.allergens)) {
      continue;
    }
    
    if (preferences.dietType === 'vegetarian' && !recipe.isVegetarian) {
      continue;
    }
    
    const matchScore = calculateMatchScore(recipe, selectedIngredients, preferences);
    
    if (matchScore < 30) {
      continue;
    }
    
    const matchedIngredients = recipe.ingredients.filter(ri =>
      selectedNames.some(sn => ri.includes(sn) || sn.includes(ri))
    );
    
    const missingIngredients = recipe.ingredients.filter(ri =>
      !matchedIngredients.some(mi => mi === ri)
    );
    
    results.push({
      recipe,
      matchScore: Math.round(matchScore * 10) / 10,
      matchedIngredients,
      missingIngredients,
    });
  }
  
  results.sort((a, b) => b.matchScore - a.matchScore);
  
  const endTime = performance.now();
  console.debug(`推荐引擎计算耗时: ${(endTime - startTime).toFixed(2)}ms`);
  
  return results.slice(0, 10);
};

export const preloadRecipes = (recipes: Recipe[]): Map<string, Recipe> => {
  const recipeMap = new Map<string, Recipe>();
  recipes.forEach(recipe => recipeMap.set(recipe.id, recipe));
  return recipeMap;
};
