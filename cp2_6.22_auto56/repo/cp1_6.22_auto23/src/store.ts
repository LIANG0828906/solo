import { create } from 'zustand'
import type { Recipe, Comment } from './types'

interface RecipeStore {
  recipes: Recipe[]
  comments: Comment[]
  loading: boolean
  newRecipeId: string | null
  fetchRecipes: () => Promise<void>
  fetchRecipe: (id: string) => Promise<Recipe | undefined>
  createRecipe: (recipe: Omit<Recipe, 'id' | 'rating' | 'ratingCount' | 'favorited' | 'createdAt'>) => Promise<Recipe>
  rateRecipe: (id: string, rating: number) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  fetchComments: (recipeId: string, page: number, limit: number) => Promise<Comment[]>
  addComment: (recipeId: string, content: string) => Promise<Comment>
  clearNewRecipeId: () => void
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipes: [],
  comments: [],
  loading: false,
  newRecipeId: null,

  fetchRecipes: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/recipes')
      const data = await res.json()
      set({ recipes: data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchRecipe: async (id: string) => {
    const existing = get().recipes.find(r => r.id === id)
    if (existing) return existing
    try {
      const res = await fetch(`/api/recipes/${id}`)
      const data = await res.json()
      return data
    } catch {
      return undefined
    }
  },

  createRecipe: async (recipe) => {
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe),
    })
    const data = await res.json()
    set(state => ({
      recipes: [data, ...state.recipes],
      newRecipeId: data.id,
    }))
    return data
  },

  rateRecipe: async (id, rating) => {
    const res = await fetch(`/api/recipes/${id}/rate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    })
    const data = await res.json()
    set(state => ({
      recipes: state.recipes.map(r => r.id === id ? data : r),
    }))
  },

  toggleFavorite: async (id) => {
    const res = await fetch(`/api/recipes/${id}/favorite`, {
      method: 'PUT',
    })
    const data = await res.json()
    set(state => ({
      recipes: state.recipes.map(r => r.id === id ? data : r),
    }))
  },

  fetchComments: async (recipeId, page, limit) => {
    const res = await fetch(`/api/recipes/${recipeId}/comments?page=${page}&limit=${limit}`)
    const data = await res.json()
    set(state => ({
      comments: page === 1 ? data : [...state.comments, ...data.filter((c: Comment) => !state.comments.some(sc => sc.id === c.id))],
    }))
    return data
  },

  addComment: async (recipeId, content) => {
    const res = await fetch(`/api/recipes/${recipeId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    const data = await res.json()
    set(state => ({
      comments: [data, ...state.comments],
    }))
    return data
  },

  clearNewRecipeId: () => set({ newRecipeId: null }),
}))
