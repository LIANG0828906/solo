import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Ingredient, WasteRecord, Category } from '@/types'

interface StoreState {
  ingredients: Ingredient[]
  wasteRecords: WasteRecord[]
  sidebarOpen: boolean
}

interface StoreActions {
  addIngredient: (ingredient: Omit<Ingredient, 'id' | 'createdAt'>) => void
  removeIngredient: (id: string) => void
  updateIngredientQuantity: (id: string, quantity: number) => void
  consumeIngredients: (items: { name: string; quantity: number }[]) => void
  recordWaste: (ingredientName: string, category: Category, quantity: number, unit: string) => void
  toggleSidebar: () => void
  openSidebar: () => void
  closeSidebar: () => void
}

type Store = StoreState & StoreActions

export const useStore = create<Store>()(
  persist(
    (set) => ({
      ingredients: [],
      wasteRecords: [],
      sidebarOpen: false,

      addIngredient: (ingredient) =>
        set((state) => ({
          ingredients: [
            ...state.ingredients,
            {
              ...ingredient,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      removeIngredient: (id) =>
        set((state) => ({
          ingredients: state.ingredients.filter((i) => i.id !== id),
        })),

      updateIngredientQuantity: (id, quantity) =>
        set((state) => ({
          ingredients: state.ingredients.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        })),

      consumeIngredients: (items) =>
        set((state) => {
          const ingredients = [...state.ingredients]
          const newWasteRecords: WasteRecord[] = []

          for (const item of items) {
            const index = ingredients.findIndex((i) => i.name === item.name)
            if (index === -1) continue

            const ingredient = ingredients[index]
            const remaining = ingredient.quantity - item.quantity

            if (remaining <= 0) {
              newWasteRecords.push({
                id: crypto.randomUUID(),
                ingredientName: ingredient.name,
                category: ingredient.category,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                date: new Date().toISOString(),
                type: 'consumed',
              })
              ingredients.splice(index, 1)
            } else {
              ingredients[index] = { ...ingredient, quantity: remaining }
              newWasteRecords.push({
                id: crypto.randomUUID(),
                ingredientName: ingredient.name,
                category: ingredient.category,
                quantity: item.quantity,
                unit: ingredient.unit,
                date: new Date().toISOString(),
                type: 'consumed',
              })
            }
          }

          return {
            ingredients,
            wasteRecords: [...state.wasteRecords, ...newWasteRecords],
          }
        }),

      recordWaste: (ingredientName, category, quantity, unit) =>
        set((state) => ({
          wasteRecords: [
            ...state.wasteRecords,
            {
              id: crypto.randomUUID(),
              ingredientName,
              category,
              quantity,
              unit,
              date: new Date().toISOString(),
              type: 'wasted' as const,
            },
          ],
        })),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      openSidebar: () => set({ sidebarOpen: true }),

      closeSidebar: () => set({ sidebarOpen: false }),
    }),
    {
      name: 'fridge-manager-store',
      partialize: (state) => ({
        ingredients: state.ingredients,
        wasteRecords: state.wasteRecords,
      }),
    }
  )
)
