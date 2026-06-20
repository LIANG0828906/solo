import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { set, get, del } from 'idb-keyval'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import defaultFoods from '../data/foods.json'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type GoalType = 'lose' | 'gain' | 'maintain'
export type Gender = 'male' | 'female'

export interface Food {
  id: string
  name: string
  serving: string
  calories: number
  protein: number
  carbs: number
  fat: number
  isCustom?: boolean
}

export interface MealRecord {
  id: string
  foodId: string
  foodName: string
  serving: string
  quantity: number
  mealType: MealType
  timestamp: number
  dateStr: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface UserProfile {
  gender: Gender
  age: number
  height: number
  weight: number
  goal: GoalType
}

export interface DailyTarget {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface FoodState {
  customFoods: Food[]
  records: MealRecord[]
  profile: UserProfile | null
  target: DailyTarget
  isFirstTime: boolean

  initStore: () => Promise<void>
  addRecord: (food: Food, quantity: number, mealType: MealType) => void
  deleteRecord: (recordId: string) => void
  addCustomFood: (food: Omit<Food, 'id' | 'isCustom'>) => Food
  setProfile: (profile: UserProfile) => void
  calculateTarget: (profile: UserProfile) => DailyTarget
  getDayRecords: (date: Date) => MealRecord[]
  getDayNutrition: (date: Date) => { calories: number; protein: number; carbs: number; fat: number }
  hasRecordsOnDay: (date: Date) => boolean
  getWeeklyData: () => { date: string; calories: number; target: number }[]
  getAllFoods: () => Food[]
}

const idbStorage = {
  getItem: async (name: string) => {
    const val = await get(name)
    return val ?? null
  },
  setItem: async (name: string, value: string) => {
    await set(name, JSON.parse(value))
  },
  removeItem: async (name: string) => {
    await del(name)
  },
}

export const useFoodStore = create<FoodState>()(
  persist(
    (set, get) => ({
      customFoods: [] as Food[],
      records: [],
      profile: null,
      target: { calories: 2000, protein: 120, carbs: 250, fat: 65 },
      isFirstTime: true,

      getAllFoods: () => {
        return [...(defaultFoods as Food[]), ...get().customFoods]
      },

      initStore: async () => {
        try {
          const profile = get().profile
          if (profile) {
            const target = get().calculateTarget(profile)
            set({ target, isFirstTime: false })
          }
        } catch (e) {
          console.error('Init store error:', e)
        }
      },

      addRecord: (food, quantity, mealType) => {
        const now = new Date()
        const record: MealRecord = {
          id: uuidv4(),
          foodId: food.id,
          foodName: food.name,
          serving: food.serving,
          quantity,
          mealType,
          timestamp: now.getTime(),
          dateStr: format(now, 'yyyy-MM-dd'),
          calories: Math.round(food.calories * quantity * 10) / 10,
          protein: Math.round(food.protein * quantity * 10) / 10,
          carbs: Math.round(food.carbs * quantity * 10) / 10,
          fat: Math.round(food.fat * quantity * 10) / 10,
        }
        set((state) => ({
          records: [...state.records, record],
        }))
      },

      deleteRecord: (recordId) => {
        set((state) => ({
          records: state.records.filter((r) => r.id !== recordId),
        }))
      },

      addCustomFood: (foodData) => {
        const newFood: Food = {
          ...foodData,
          id: uuidv4(),
          isCustom: true,
        }
        set((state) => ({
          customFoods: [...state.customFoods, newFood],
        }))
        return newFood
      },

      setProfile: (profile) => {
        const target = get().calculateTarget(profile)
        set({ profile, target, isFirstTime: false })
      },

      calculateTarget: (profile) => {
        const { gender, age, height, weight, goal } = profile

        let bmr: number
        if (gender === 'male') {
          bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
        } else {
          bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age
        }

        const tdee = bmr * 1.55

        let calories: number
        let proteinRatio: number
        let carbsRatio: number
        let fatRatio: number

        switch (goal) {
          case 'lose':
            calories = Math.round(tdee * 0.8)
            proteinRatio = 0.3
            carbsRatio = 0.4
            fatRatio = 0.3
            break
          case 'gain':
            calories = Math.round(tdee * 1.15)
            proteinRatio = 0.3
            carbsRatio = 0.45
            fatRatio = 0.25
            break
          case 'maintain':
          default:
            calories = Math.round(tdee)
            proteinRatio = 0.25
            carbsRatio = 0.5
            fatRatio = 0.25
            break
        }

        const proteinPerGram = 4
        const carbsPerGram = 4
        const fatPerGram = 9

        const protein = Math.round((calories * proteinRatio) / proteinPerGram)
        const carbs = Math.round((calories * carbsRatio) / carbsPerGram)
        const fat = Math.round((calories * fatRatio) / fatPerGram)

        return { calories, protein, carbs, fat }
      },

      getDayRecords: (date) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        return get()
          .records.filter((r) => r.dateStr === dateStr)
          .sort((a, b) => a.timestamp - b.timestamp)
      },

      getDayNutrition: (date) => {
        const records = get().getDayRecords(date)
        return records.reduce(
          (acc, r) => ({
            calories: Math.round((acc.calories + r.calories) * 10) / 10,
            protein: Math.round((acc.protein + r.protein) * 10) / 10,
            carbs: Math.round((acc.carbs + r.carbs) * 10) / 10,
            fat: Math.round((acc.fat + r.fat) * 10) / 10,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        )
      },

      hasRecordsOnDay: (date) => {
        return get().getDayRecords(date).length > 0
      },

      getWeeklyData: () => {
        const result: { date: string; calories: number; target: number }[] = []
        const today = new Date()
        const target = get().target

        for (let i = 6; i >= 0; i--) {
          const d = new Date(today)
          d.setDate(d.getDate() - i)
          const nutrition = get().getDayNutrition(d)
          result.push({
            date: format(d, 'MM/dd', { locale: zhCN }),
            calories: Math.round(nutrition.calories),
            target: target.calories,
          })
        }
        return result
      },
    }),
    {
      name: 'nutrition-diary-storage',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        customFoods: state.customFoods,
        records: state.records,
        profile: state.profile,
        target: state.target,
        isFirstTime: state.isFirstTime,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initStore()
        }
      },
    }
  )
)

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
}

export const MEAL_TYPE_EMOJIS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
}

export const GOAL_LABELS: Record<GoalType, string> = {
  lose: '减脂',
  gain: '增肌',
  maintain: '保持',
}
