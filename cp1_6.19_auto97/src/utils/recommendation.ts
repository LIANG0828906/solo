import type { Recipe, UserRating } from '../types/recipe';

export function getRecommendedRecipes(
  recipes: Recipe[],
  userRatings: UserRating[],
  favorites: string[],
  count: number = 4
): Recipe[] {
  const ratedIds = new Set(userRatings.map(r => r.recipeId));
  const favoriteRecipes = recipes.filter(r => favorites.includes(r.id));
  const ratedRecipes = recipes.filter(r => ratedIds.has(r.id));

  const preferenceRecipes = [...favoriteRecipes, ...ratedRecipes];
  
  if (preferenceRecipes.length === 0) {
    return recipes
      .sort((a, b) => b.rating - a.rating)
      .slice(0, count);
  }

  const tagFrequency: Record<string, number> = {};
  const difficultyFrequency: Record<string, number> = {};
  const cuisineFrequency: Record<string, number> = {};

  preferenceRecipes.forEach(recipe => {
    recipe.tags.forEach(tag => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });
    difficultyFrequency[recipe.difficulty] = (difficultyFrequency[recipe.difficulty] || 0) + 1;
    cuisineFrequency[recipe.cuisine] = (cuisineFrequency[recipe.cuisine] || 0) + 1;
  });

  const candidateRecipes = recipes.filter(
    r => !favorites.includes(r.id) && !ratedIds.has(r.id)
  );

  if (candidateRecipes.length === 0) {
    return recipes
      .sort((a, b) => b.rating - a.rating)
      .slice(0, count);
  }

  const scoredRecipes = candidateRecipes.map(recipe => {
    let score = 0;

    recipe.tags.forEach(tag => {
      if (tagFrequency[tag]) {
        score += tagFrequency[tag] * 2;
      }
    });

    if (difficultyFrequency[recipe.difficulty]) {
      score += difficultyFrequency[recipe.difficulty];
    }

    if (cuisineFrequency[recipe.cuisine]) {
      score += cuisineFrequency[recipe.cuisine] * 1.5;
    }

    score += recipe.rating * 0.5;

    return { recipe, score };
  });

  scoredRecipes.sort((a, b) => b.score - a.score);

  return scoredRecipes.slice(0, count).map(item => item.recipe);
}
