import { create } from 'zustand'
import type { Recipe, ShoppingItem, Toast, View } from '../types'
import {
  aggregateShoppingItems,
  generateId,
  loadFavorites,
  loadShoppingList,
  saveFavorites,
  saveShoppingList,
} from '../utils'

interface RecipeStore {
  recipes: Recipe[]
  filteredRecipes: Recipe[]
  currentRecipe: Recipe | null
  favoriteIds: string[]
  shoppingList: ShoppingItem[]
  toasts: Toast[]
  view: View
  loading: boolean
  error: string | null
  currentStep: number
  setRecipes: (recipes: Recipe[]) => void
  setFilteredRecipes: (recipes: Recipe[]) => void
  setCurrentRecipe: (recipe: Recipe | null) => void
  setView: (view: View) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setCurrentStep: (step: number) => void
  fetchRecipes: () => Promise<void>
  fetchRecipe: (id: string) => Promise<void>
  searchRecipes: (keyword: string) => Promise<void>
  toggleFavorite: (recipeId: string) => void
  isFavorite: (recipeId: string) => boolean
  addToast: (message: string) => void
  removeToast: (id: string) => void
  addRecipeToShopping: (recipe: Recipe) => void
  addManualShoppingItem: (name: string, amount: number, unit: string) => void
  toggleShoppingItem: (id: string) => void
  removeShoppingItem: (id: string) => void
  syncShoppingFromFavorites: (favoriteRecipes: Recipe[]) => void
  exportShoppingFromFavorites: (favoriteRecipes: Recipe[]) => void
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipes: [],
  filteredRecipes: [],
  currentRecipe: null,
  favoriteIds: loadFavorites(),
  shoppingList: loadShoppingList(),
  toasts: [],
  view: 'list',
  loading: false,
  error: null,
  currentStep: 0,

  setRecipes: (recipes) => set({ recipes }),
  setFilteredRecipes: (recipes) => set({ filteredRecipes: recipes }),
  setCurrentRecipe: (recipe) => set({ currentRecipe: recipe }),
  setView: (view) => set({ view }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCurrentStep: (step) => set({ currentStep: step }),

  fetchRecipes: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/recipes')
      const data = await res.json()
      if (data.success) {
        set({ recipes: data.data, filteredRecipes: data.data, loading: false })
      } else {
        set({ error: data.message, loading: false })
      }
    } catch (err) {
      set({ error: '加载食谱失败，请重试', loading: false })
    }
  },

  fetchRecipe: async (id: string) => {
    set({ loading: true, error: null, currentStep: 0 })
    try {
      const res = await fetch(`/api/recipes/${id}`)
      const data = await res.json()
      if (data.success) {
        set({ currentRecipe: data.data, loading: false })
      } else {
        set({ error: data.message, loading: false })
      }
    } catch (err) {
      set({ error: '加载食谱详情失败，请重试', loading: false })
    }
  },

  searchRecipes: async (keyword: string) => {
    if (!keyword.trim()) {
      set({ filteredRecipes: get().recipes })
      return
    }
    try {
      const res = await fetch(`/api/recipes?search=${encodeURIComponent(keyword)}`)
      const data = await res.json()
      if (data.success) {
        set({ filteredRecipes: data.data })
      }
    } catch (err) {
      console.error('Search error:', err)
    }
  },

  toggleFavorite: (recipeId: string) => {
    const { favoriteIds, addToast } = get()
    const exists = favoriteIds.includes(recipeId)
    let newIds: string[]
    if (exists) {
      newIds = favoriteIds.filter((id) => id !== recipeId)
      addToast('已取消收藏')
    } else {
      newIds = [...favoriteIds, recipeId]
      addToast('已添加到收藏')
    }
    saveFavorites(newIds)
    set({ favoriteIds: newIds })
  },

  isFavorite: (recipeId: string) => {
    return get().favoriteIds.includes(recipeId)
  },

  addToast: (message: string) => {
    const id = generateId()
    set({ toasts: [...get().toasts, { id, message }] })
    setTimeout(() => get().removeToast(id), 2000)
  },

  removeToast: (id: string) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  },

  addRecipeToShopping: (recipe: Recipe) => {
    const { shoppingList } = get()
    const newItems = [...shoppingList]
    let addedCount = 0

    recipe.ingredients.forEach((ing) => {
      const existing = newItems.find((item) => item.name === ing.name)
      if (existing) {
        existing.amount += ing.amount
      } else {
        newItems.push({
          id: generateId(),
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          checked: false,
          source: recipe.name,
        })
        addedCount++
      }
    })

    saveShoppingList(newItems)
    set({ shoppingList: newItems })
    get().addToast(`已添加 ${addedCount} 种食材到购物清单`)
  },

  addManualShoppingItem: (name: string, amount: number, unit: string) => {
    if (!name.trim()) return
    const { shoppingList } = get()
    const newItem: ShoppingItem = {
      id: generateId(),
      name: name.trim(),
      amount,
      unit: unit || '个',
      checked: false,
      manual: true,
    }
    const newList = [...shoppingList, newItem]
    saveShoppingList(newList)
    set({ shoppingList: newList })
  },

  toggleShoppingItem: (id: string) => {
    const { shoppingList } = get()
    const newList = shoppingList.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    )
    saveShoppingList(newList)
    set({ shoppingList: newList })
  },

  removeShoppingItem: (id: string) => {
    const { shoppingList } = get()
    const newList = shoppingList.filter((item) => item.id !== id)
    saveShoppingList(newList)
    set({ shoppingList: newList })
  },

  syncShoppingFromFavorites: (favoriteRecipes: Recipe[]) => {
    const { shoppingList } = get()
    const manualItems = shoppingList.filter((item) => item.manual)
    const aggregated = aggregateShoppingItems(favoriteRecipes)
    const newAutoItems: ShoppingItem[] = aggregated.map((item) => ({
      id: generateId(),
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      checked: false,
      source: item.source,
    }))
    const newList = [...newAutoItems, ...manualItems]
    saveShoppingList(newList)
    set({ shoppingList: newList })
  },

  exportShoppingFromFavorites: (favoriteRecipes: Recipe[]) => {
    get().syncShoppingFromFavorites(favoriteRecipes)
    get().addToast('已导出购物清单')
    get().setView('shopping')
  },
}))
