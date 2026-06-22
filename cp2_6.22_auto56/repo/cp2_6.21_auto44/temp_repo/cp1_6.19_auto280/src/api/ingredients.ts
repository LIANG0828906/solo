import axios from 'axios'
import { Ingredient } from '../types'

const API_BASE = '/api/ingredients'

export async function fetchIngredients(params?: { category?: string }): Promise<Ingredient[]> {
  const res = await axios.get(API_BASE, { params })
  return res.data
}

export async function fetchIngredientById(id: string): Promise<Ingredient> {
  const res = await axios.get(`${API_BASE}/${id}`)
  return res.data
}

export async function createIngredient(data: Omit<Ingredient, 'id' | 'created_at' | 'distance' | 'user' | 'is_exchanged'>): Promise<Ingredient> {
  const res = await axios.post(API_BASE, data)
  return res.data
}

export async function markExchanged(id: string): Promise<Ingredient> {
  const res = await axios.put(`${API_BASE}/${id}/exchange`)
  return res.data
}

export const DEFAULT_FRESHNESS_DAYS: Record<string, number> = {
  '蔬菜': 3,
  '绿叶菜': 3,
  '水果': 5,
  '肉类': 2,
  '调味料': 30,
  '根茎类': 7,
  '乳制品': 5,
}

export function suggestExpiryDate(category: string): string {
  const days = DEFAULT_FRESHNESS_DAYS[category] || 7
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}
