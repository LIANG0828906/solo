import { recipes, commonIngredients } from '../data/recipes'
import { Recipe, MatchedRecipe } from '../../shared/types'

export function matchRecipes(ingredients: string[]): MatchedRecipe[] {
  const ingredientSet = new Set(ingredients.map(i => i.toLowerCase()))

  const matchedRecipes: MatchedRecipe[] = recipes
    .map((recipe: Recipe) => {
      const recipeIngredients = recipe.ingredients.map(i => i.toLowerCase())
      const matched = recipeIngredients.filter(i => ingredientSet.has(i))
      const missing = recipeIngredients.filter(i => !ingredientSet.has(i))
      const matchRate = recipeIngredients.length > 0
        ? matched.length / recipeIngredients.length
        : 0

      return {
        ...recipe,
        matchRate,
        matchedIngredients: matched,
        missingIngredients: missing
      }
    })
    .filter(recipe => recipe.matchRate >= 0.6)
    .sort((a, b) => {
      if (b.matchRate !== a.matchRate) {
        return b.matchRate - a.matchRate
      }
      return a.difficulty - b.difficulty
    })

  return matchedRecipes
}

export function simulateIdentification(imageCount: number): { ingredients: string[]; processingTime: number } {
  const count = Math.min(Math.floor(Math.random() * 6) + 3, commonIngredients.length, imageCount * 3)
  const shuffled = [...commonIngredients].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, count)

  const processingTime = 800 + Math.random() * 400

  return {
    ingredients: selected,
    processingTime
  }
}
