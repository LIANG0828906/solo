import { Recipe } from '@/types';

export interface RecommendOptions {
  favoriteIds?: string[];
  searchQuery?: string;
  selectedIngredients?: string[];
  maxResults?: number;
}

export class RecommendEngine {
  private recipes: Recipe[];
  private recipeIngredientSets: Map<string, Set<string>>;

  constructor(recipes: Recipe[]) {
    this.recipes = recipes;
    this.recipeIngredientSets = new Map();
    this.buildIngredientIndex();
  }

  private buildIngredientIndex(): void {
    for (const recipe of this.recipes) {
      const ingredientSet = new Set(
        recipe.mainIngredients.map((ing) => ing.ingredientId)
      );
      this.recipeIngredientSets.set(recipe.id, ingredientSet);
    }
  }

  private getRecipeIngredientSet(recipeId: string): Set<string> {
    let set = this.recipeIngredientSets.get(recipeId);
    if (!set) {
      const recipe = this.recipes.find((r) => r.id === recipeId);
      set = recipe
        ? new Set(recipe.mainIngredients.map((ing) => ing.ingredientId))
        : new Set();
      this.recipeIngredientSets.set(recipeId, set);
    }
    return set;
  }

  private static jaccardSimilarity(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 && b.size === 0) return 1;
    if (a.size === 0 || b.size === 0) return 0;

    let intersection = 0;
    const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
    for (const item of smaller) {
      if (larger.has(item)) {
        intersection++;
      }
    }

    const union = a.size + b.size - intersection;
    return intersection / union;
  }

  private calculateScore(
    recipe: Recipe,
    favoriteIds: string[],
    selectedIngredients: string[]
  ): number {
    let score = 0;

    score += recipe.rating * 20;

    score += Math.log(recipe.ratingCount + 1) * 10;

    if (selectedIngredients.length > 0) {
      const selectedSet = new Set(selectedIngredients);
      const recipeSet = this.getRecipeIngredientSet(recipe.id);
      const similarity = RecommendEngine.jaccardSimilarity(selectedSet, recipeSet);
      score += similarity * 50;
    }

    if (favoriteIds.includes(recipe.id)) {
      score += 25;
    }

    const ageInDays = (Date.now() - recipe.createdAt) / (1000 * 60 * 60 * 24);
    const recencyBonus = Math.max(0, 10 - ageInDays * 0.1);
    score += recencyBonus;

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

  getRecommendations(options: RecommendOptions = {}): Recipe[] {
    const {
      favoriteIds = [],
      searchQuery = '',
      selectedIngredients = [],
      maxResults = 20,
    } = options;

    const favoriteSet = new Set(favoriteIds);
    const hasSearchQuery = searchQuery.trim() !== '';
    const query = hasSearchQuery ? searchQuery.toLowerCase() : '';

    const scoredRecipes: { recipe: Recipe; score: number }[] = [];

    for (const recipe of this.recipes) {
      if (hasSearchQuery && !this.matchesSearch(recipe, query)) {
        continue;
      }

      const score = this.calculateScore(recipe, favoriteIds, selectedIngredients);
      scoredRecipes.push({ recipe, score });
    }

    scoredRecipes.sort((a, b) => b.score - a.score);

    return scoredRecipes.slice(0, maxResults).map((item) => item.recipe);
  }

  filterByIngredients(ingredientIds: string[]): Recipe[] {
    if (ingredientIds.length === 0) return this.recipes;

    const ingredientSet = new Set(ingredientIds);
    return this.recipes.filter((recipe) => {
      const recipeSet = this.getRecipeIngredientSet(recipe.id);
      for (const id of ingredientSet) {
        if (recipeSet.has(id)) return true;
      }
      return false;
    });
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

    const targetIngredientSet = this.getRecipeIngredientSet(recipeId);
    const targetMethod = targetRecipe.cookingMethod;
    const targetCuisine = targetRecipe.cuisine;

    const similar: { recipe: Recipe; similarity: number }[] = [];

    for (const recipe of this.recipes) {
      if (recipe.id === recipeId) continue;

      let similarity = 0;

      const recipeIngredientSet = this.getRecipeIngredientSet(recipe.id);
      let intersection = 0;
      const [smaller, larger] =
        targetIngredientSet.size <= recipeIngredientSet.size
          ? [targetIngredientSet, recipeIngredientSet]
          : [recipeIngredientSet, targetIngredientSet];
      for (const item of smaller) {
        if (larger.has(item)) {
          intersection++;
        }
      }
      similarity += intersection * 2;

      if (recipe.cookingMethod === targetMethod) {
        similarity += 3;
      }

      if (targetCuisine && recipe.cuisine === targetCuisine) {
        similarity += 2;
      }

      similarity += recipe.rating;

      similar.push({ recipe, similarity });
    }

    similar.sort((a, b) => b.similarity - a.similarity);

    return similar.slice(0, limit).map((item) => item.recipe);
  }
}
