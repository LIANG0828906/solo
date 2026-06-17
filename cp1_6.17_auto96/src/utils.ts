import { v4 as uuidv4 } from 'uuid'
import type { Recipe, ShoppingItem } from './types'

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function createRipple(event: React.MouseEvent<HTMLElement>) {
  const button = event.currentTarget
  const rect = button.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2

  const ripple = document.createElement('span')
  ripple.className = 'ripple'
  ripple.style.width = ripple.style.height = `${size}px`
  ripple.style.left = `${x}px`
  ripple.style.top = `${y}px`

  button.appendChild(ripple)
  setTimeout(() => ripple.remove(), 400)
}

export function aggregateShoppingItems(
  recipes: Recipe[]
): Omit<ShoppingItem, 'checked' | 'id'>[] {
  const map = new Map<string, { amount: number; unit: string; sources: string[] }>()

  recipes.forEach((recipe) => {
    recipe.ingredients.forEach((ing) => {
      const existing = map.get(ing.name)
      if (existing) {
        existing.amount += ing.amount
        if (!existing.sources.includes(recipe.name)) {
          existing.sources.push(recipe.name)
        }
      } else {
        map.set(ing.name, {
          amount: ing.amount,
          unit: ing.unit,
          sources: [recipe.name],
        })
      }
    })
  })

  return Array.from(map.entries()).map(([name, data]) => ({
    name,
    amount: data.amount,
    unit: data.unit,
    source: data.sources.join('、'),
  }))
}

export function generateId(): string {
  return uuidv4()
}

const FAVORITES_KEY = 'recipe_favorites'
const SHOPPING_KEY = 'recipe_shopping'

export function loadFavorites(): string[] {
  try {
    const data = localStorage.getItem(FAVORITES_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveFavorites(ids: string[]): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
}

export function loadShoppingList(): ShoppingItem[] {
  try {
    const data = localStorage.getItem(SHOPPING_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveShoppingList(items: ShoppingItem[]): void {
  localStorage.setItem(SHOPPING_KEY, JSON.stringify(items))
}
