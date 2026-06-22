import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { foods } from '../data/seedData.js'

interface FoodLogEntry {
  id: string
  foodId: string
  foodName: string
  servingSize: number
  calories: number
  protein: number
  fat: number
  carbs: number
  fiber: number
  date: string
  mealType: string
  createdAt: string
}

interface UserProfile {
  gender: 'male' | 'female'
  age: number
  weight: number
  height: number
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive'
  bmr: number
  tdee: number
  recommendedCalories: number
  recommendedProtein: number
  recommendedFat: number
  recommendedCarbs: number
}

interface NutritionGoals {
  calories: number
  protein: number
  fat: number
  carbs: number
  fiber: number
}

const foodLogStore = new Map<string, FoodLogEntry>()
let userProfile: UserProfile | null = null
let nutritionGoals: NutritionGoals = {
  calories: 2000,
  protein: 150,
  fat: 56,
  carbs: 225,
  fiber: 25,
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
}

function calculateBMR(gender: string, weight: number, height: number, age: number): number {
  if (gender === 'male') {
    return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
  }
  return 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age
}

function calculateRecommendedMacros(tdee: number) {
  return {
    recommendedCalories: Math.round(tdee),
    recommendedProtein: Math.round((tdee * 0.3) / 4),
    recommendedFat: Math.round((tdee * 0.25) / 9),
    recommendedCarbs: Math.round((tdee * 0.45) / 4),
  }
}

const foodRouter = Router()

foodRouter.get('/search', (req: Request, res: Response): void => {
  const q = req.query.q as string
  if (!q) {
    res.json({ success: true, data: foods })
    return
  }
  const results = foods.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()))
  res.json({ success: true, data: results })
})

foodRouter.get('/', (_req: Request, res: Response): void => {
  res.json({ success: true, data: foods })
})

foodRouter.post('/log', (req: Request, res: Response): void => {
  const { foodId, servingSize, date, mealType } = req.body
  const food = foods.find((f) => f.id === foodId)
  if (!food) {
    res.status(404).json({ success: false, error: 'Food not found' })
    return
  }
  const ratio = servingSize / 100
  const entry: FoodLogEntry = {
    id: uuidv4(),
    foodId,
    foodName: food.name,
    servingSize,
    calories: Math.round(food.calories * ratio),
    protein: Math.round(food.protein * ratio * 10) / 10,
    fat: Math.round(food.fat * ratio * 10) / 10,
    carbs: Math.round(food.carbs * ratio * 10) / 10,
    fiber: Math.round(food.fiber * ratio * 10) / 10,
    date,
    mealType,
    createdAt: new Date().toISOString(),
  }
  foodLogStore.set(entry.id, entry)
  res.status(201).json({ success: true, data: entry })
})

foodRouter.get('/log/range', (req: Request, res: Response): void => {
  const { start, end } = req.query as { start?: string; end?: string }
  if (!start || !end) {
    res.status(400).json({ success: false, error: 'start and end query params are required' })
    return
  }
  const logs = Array.from(foodLogStore.values()).filter(
    (entry) => entry.date >= start && entry.date <= end,
  )
  res.json({ success: true, data: logs })
})

foodRouter.get('/log', (req: Request, res: Response): void => {
  const { date } = req.query as { date?: string }
  let logs = Array.from(foodLogStore.values())
  if (date) {
    logs = logs.filter((entry) => entry.date === date)
  }
  res.json({ success: true, data: logs })
})

foodRouter.delete('/log/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  if (!foodLogStore.has(id)) {
    res.status(404).json({ success: false, error: 'Log entry not found' })
    return
  }
  foodLogStore.delete(id)
  res.json({ success: true, message: 'Log entry deleted' })
})

foodRouter.put('/log/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const existing = foodLogStore.get(id)
  if (!existing) {
    res.status(404).json({ success: false, error: 'Log entry not found' })
    return
  }
  const { servingSize, date, mealType } = req.body
  const updatedServingSize = servingSize ?? existing.servingSize
  const food = foods.find((f) => f.id === existing.foodId)
  const ratio = updatedServingSize / 100
  const updated: FoodLogEntry = {
    ...existing,
    servingSize: updatedServingSize,
    date: date ?? existing.date,
    mealType: mealType ?? existing.mealType,
    calories: Math.round((food?.calories ?? 0) * ratio),
    protein: Math.round((food?.protein ?? 0) * ratio * 10) / 10,
    fat: Math.round((food?.fat ?? 0) * ratio * 10) / 10,
    carbs: Math.round((food?.carbs ?? 0) * ratio * 10) / 10,
    fiber: Math.round((food?.fiber ?? 0) * ratio * 10) / 10,
  }
  foodLogStore.set(id, updated)
  res.json({ success: true, data: updated })
})

const apiRouter = Router()

apiRouter.get('/profile', (_req: Request, res: Response): void => {
  res.json({ success: true, data: userProfile })
})

apiRouter.post('/profile', (req: Request, res: Response): void => {
  const { gender, age, weight, height, activityLevel } = req.body
  if (!gender || !age || !weight || !height || !activityLevel) {
    res.status(400).json({ success: false, error: 'All profile fields are required' })
    return
  }
  const bmr = calculateBMR(gender, weight, height, age)
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.2
  const tdee = bmr * multiplier
  const macros = calculateRecommendedMacros(tdee)
  userProfile = {
    gender,
    age,
    weight,
    height,
    activityLevel,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    ...macros,
  }
  nutritionGoals = {
    calories: macros.recommendedCalories,
    protein: macros.recommendedProtein,
    fat: macros.recommendedFat,
    carbs: macros.recommendedCarbs,
    fiber: 25,
  }
  res.json({ success: true, data: userProfile })
})

apiRouter.get('/goals', (_req: Request, res: Response): void => {
  res.json({ success: true, data: nutritionGoals })
})

apiRouter.put('/goals', (req: Request, res: Response): void => {
  const { calories, protein, fat, carbs, fiber } = req.body
  nutritionGoals = {
    calories: calories ?? nutritionGoals.calories,
    protein: protein ?? nutritionGoals.protein,
    fat: fat ?? nutritionGoals.fat,
    carbs: carbs ?? nutritionGoals.carbs,
    fiber: fiber ?? nutritionGoals.fiber,
  }
  res.json({ success: true, data: nutritionGoals })
})

export { foodRouter, apiRouter }
