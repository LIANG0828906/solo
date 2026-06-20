import { create } from 'zustand'
import { User, Recipe, SearchFilters } from '../types'
import axios from 'axios'

interface RecipeState {
  user: User | null
  recipes: Recipe[]
  favorites: Recipe[]
  searchKeyword: string
  filters: SearchFilters
  setUser: (user: User | null) => void
  setRecipes: (recipes: Recipe[]) => void
  setFavorites: (favorites: Recipe[]) => void
  setSearchKeyword: (keyword: string) => void
  setFilters: (filters: Partial<SearchFilters>) => void
  fetchRecipes: () => Promise<void>
  fetchFavorites: () => Promise<void>
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  user: null,
  recipes: [],
  favorites: [],
  searchKeyword: '',
  filters: {
    q: '',
    tag: '',
    cook_time: '',
    author: '',
  },

  setUser: (user) => set({ user }),
  
  setRecipes: (recipes) => set({ recipes }),
  
  setFavorites: (favorites) => set({ favorites }),
  
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  
  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),

  fetchRecipes: async () => {
    try {
      const { user, filters } = get()
      const params: Record<string, string | number> = {}
      if (user?.id) params.user_id = user.id
      if (filters.q) params.q = filters.q
      if (filters.tag) params.tag = filters.tag
      if (filters.cook_time) params.cook_time = filters.cook_time
      if (filters.author) params.author = filters.author

      const endpoint = filters.q || filters.tag || filters.cook_time || filters.author
        ? '/api/recipes/search'
        : '/api/recipes'

      const response = await axios.get<Recipe[]>(endpoint, { params })
      set({ recipes: response.data })
    } catch (error) {
      console.error('Failed to fetch recipes:', error)
    }
  },

  fetchFavorites: async () => {
    try {
      const { user } = get()
      if (!user) return
      
      const response = await axios.get<Recipe[]>('/api/user/favorites', {
        params: { user_id: user.id },
      })
      set({ favorites: response.data })
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
    }
  },

  login: async (username: string, password: string) => {
    try {
      const response = await axios.post<User>('/api/user/login', {
        username,
        password,
      })
      set({ user: response.data })
      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  },

  logout: () => {
    set({ user: null })
  },
}))
