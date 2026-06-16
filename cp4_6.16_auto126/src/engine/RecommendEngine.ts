import { Recipe } from '@/types';

export interface RecommendOptions {
  favoriteIds?: string[];
  searchQuery?: string;
  selectedIngredients?: string[];
  maxResults?: number;
}

export class RecommendEngine {
  private recipes: Recipe[];

  constructor(recipes: Recipe[]) {
    this.recipes = recipes;
  }

  getRecommendations(options: RecommendOptions = {}): Recipe[] {
    const {
      favoriteIds = [],
      searchQuery = '',
      selectedIngredients = [],
      maxResults = 20,
    } = options;

    let scoredRecipes = this.recipes.map((recipe) => ({
      recipe,
      score: this.calculateScore(recipe, favoriteIds, selectedIngredients),
    }));

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      scoredRecipes = scoredRecipes.filter(({ recipe }) =>
        this.matchesSearch(recipe, query)
      );
    }

    scoredRecipes.sort((a, b) => b.score - a.score);

    return scoredRecipes.slice(0, maxResults).map((item) => item.recipe);
  }

  private calculateScore(
    recipe: Recipe,
    favoriteIds: string[],
    selectedIngredients: string[]
  ): number {
    let score = 0;

    score += recipe.rating * 10;

    score += Math.log10(recipe.ratingCount + 1) * 5;

    const ingredientMatchCount = recipe.mainIngredients.filter((ing) =>
      selectedIngredients.includes(ing.ingredientId)
    ).length;
    if (selectedIngredients.length > 0) {
      score += (ingredientMatchCount / selectedIngredients.length) * 30;
    }

    if (favoriteIds.includes(recipe.id)) {
      score += 15;
    }

    const ageInDays = (Date.now() - recipe.createdAt) / (1000 * 60 * 60 * 24);
    const recencyBonus = Math.max(0, 10 - ageInDays * 0.1);
    score += recencyBonus;

    score += Math.random() * 2;

    return score;
  }

  private matchesSearch(recipe: Recipe, query: string): boolean {
    if (recipe.name.toLowerCase().includes(query)) return true;
    if (recipe.description.toLowerCase().includes(query)) return true;
    if (recipe.author.toLowerCase().includes(query)) return true;
    if (recipe.cuisine?.toLowerCase().includes(query)) return true;

    for (const ingredient of recipe.mainIngredients) {
      if (ingredient.ingredientId.toLowerCase().includes(query)) return true;
    }

    return false;
  }

  filterByIngredients(ingredientIds: string[]): Recipe[] {
    if (ingredientIds.length === 0) return this.recipes;

    return this.recipes.filter((recipe) =>
      ingredientIds.some((id) =>
        recipe.mainIngredients.some((ing) => ing.ingredientId === id)
      )
    );
  }

  filterByDifficulty(difficulty: 1 | 2 | 3): Recipe[] {
    return this.recipes.filter((recipe) => recipe.difficulty === difficulty);
  }

  filterByCuisine(cuisine: string): Recipe[] {
    return this.recipes.filter((recipe) => recipe.cuisine === cuisine);
  }

  getSimilarRecipes(recipeId: string, limit = 5): Recipe[] {
    const targetRecipe = this.recipes.find((r) => r.id === recipeId);
    if (!targetRecipe) return [];

    const targetIngredientIds = targetRecipe.mainIngredients.map(
      (ing) => ing.ingredientId
    );

    const similar = this.recipes
      .filter((r) => r.id !== recipeId)
      .map((recipe) => {
        const commonIngredients = recipe.mainIngredients.filter((ing) =>
          targetIngredientIds.includes(ing.ingredientId)
        ).length;

        const sameMethod = recipe.cookingMethod === targetRecipe.cookingMethod ? 1 : 0;
        const sameCuisine = recipe.cuisine === targetRecipe.cuisine ? 1 : 0;

        const similarity =
          commonIngredients * 2 + sameMethod * 3 + sameCuisine * 2 + recipe.rating;

        return { recipe, similarity };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map((item) => item.recipe);

    return similar;
  }
}
