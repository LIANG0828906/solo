import { create } from 'zustand'
import { Recipe, recipes, allIngredients } from '../data/recipes'

export type Page = 'upload' | 'result' | 'detail'

interface AppState {
  currentPage: Page
  imageUrl: string | null
  detectedIngredients: string[]
  matchedRecipes: Recipe[]
  selectedRecipe: Recipe | null
  setImageAndResults: (imageUrl: string) => void
  selectRecipe: (recipe: Recipe) => void
  goBack: () => void
  reset: () => void
}

const simulateIngredientDetection = (): string[] => {
  const shuffled = [...allIngredients].sort(() => Math.random() - 0.5)
  const count = Math.floor(Math.random() * 3) + 3
  return shuffled.slice(0, count)
}

const matchRecipes = (ingredients: string[]): Recipe[] => {
  const ingredientSet = new Set(ingredients)
  return recipes
    .map(recipe => {
      const matchedCount = recipe.ingredients.filter(ing => ingredientSet.has(ing)).length
      return { recipe, matchedCount }
    })
    .filter(item => item.matchedCount >= 2)
    .sort((a, b) => b.matchedCount - a.matchedCount)
    .map(item => item.recipe)
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'upload',
  imageUrl: null,
  detectedIngredients: [],
  matchedRecipes: [],
  selectedRecipe: null,
  setImageAndResults: (imageUrl: string) => {
    const detected = simulateIngredientDetection()
    const matched = matchRecipes(detected)
    set({
      currentPage: 'result',
      imageUrl,
      detectedIngredients: detected,
      matchedRecipes: matched,
    })
  },
  selectRecipe: (recipe: Recipe) => {
    set({
      currentPage: 'detail',
      selectedRecipe: recipe,
    })
  },
  goBack: () => {
    set((state) => ({
      currentPage: state.currentPage === 'detail' ? 'result' : 'upload',
      selectedRecipe: state.currentPage === 'detail' ? null : state.selectedRecipe,
    }))
  },
  reset: () => {
    set({
      currentPage: 'upload',
      imageUrl: null,
      detectedIngredients: [],
      matchedRecipes: [],
      selectedRecipe: null,
    })
  },
}))
