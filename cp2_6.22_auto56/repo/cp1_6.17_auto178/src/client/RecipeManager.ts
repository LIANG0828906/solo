import { create } from 'zustand'
import axios from 'axios'

interface Recipe {
  id: string
  name: string
  coverImage: string
  author: string
  prepTime: string
  cookTime: string
  difficulty: 'easy' | 'medium' | 'hard'
  cuisine: 'chinese' | 'western' | 'japanese'
  ingredients: Ingredient[]
  steps: Step[]
  likes: number
}

interface Ingredient {
  name: string
  amount: string
  category: 'vegetable' | 'meat' | 'seasoning' | 'other'
}

interface Step {
  order: number
  description: string
}

interface RecipeState {
  recipes: Recipe[]
  currentRecipe: Recipe | null
  searchKeyword: string
  cuisineFilter: string
  loading: boolean
  fetchRecipes: () => Promise<void>
  searchRecipes: (keyword: string, cuisine: string) => Promise<void>
  fetchRecipeById: (id: string) => Promise<void>
  addRecipe: (recipe: Omit<Recipe, 'id' | 'likes'>) => Promise<void>
  setSearchKeyword: (keyword: string) => void
  setCuisineFilter: (cuisine: string) => void
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  currentRecipe: null,
  searchKeyword: '',
  cuisineFilter: '',
  loading: false,

  fetchRecipes: async () => {
    set({ loading: true })
    try {
      const res = await axios.get('/api/recipes')
      set({ recipes: res.data.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  searchRecipes: async (keyword: string, cuisine: string) => {
    set({ loading: true })
    try {
      const res = await axios.get('/api/recipes', {
        params: { keyword, cuisine },
      })
      set({ recipes: res.data.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchRecipeById: async (id: string) => {
    set({ loading: true })
    try {
      const res = await axios.get(`/api/recipes/${id}`)
      set({ currentRecipe: res.data.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  addRecipe: async (recipe) => {
    try {
      const res = await axios.post('/api/recipes', recipe)
      set((state) => ({ recipes: [...state.recipes, res.data.data] }))
    } catch {
      // noop
    }
  },

  setSearchKeyword: (keyword: string) => {
    set({ searchKeyword: keyword })
    const { cuisineFilter } = get()
    get().searchRecipes(keyword, cuisineFilter)
  },

  setCuisineFilter: (cuisine: string) => {
    set({ cuisineFilter: cuisine })
    const { searchKeyword } = get()
    get().searchRecipes(searchKeyword, cuisine)
  },
}))
