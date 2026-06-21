import { v4 as uuidv4 } from 'uuid'

export interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface LogEntry {
  id: string
  userId: string
  foodId: string
  foodName: string
  mealType: MealType
  grams: number
  calories: number
  protein: number
  carbs: number
  fat: number
  date: string
}

const foodDatabase: FoodItem[] = [
  { id: 'f001', name: '米饭', calories: 116, protein: 2.6, carbs: 25.9, fat: 0.3 },
  { id: 'f002', name: '鸡胸肉', calories: 133, protein: 19.4, carbs: 2.5, fat: 5.0 },
  { id: 'f003', name: '鸡蛋', calories: 144, protein: 13.3, carbs: 2.8, fat: 8.8 },
  { id: 'f004', name: '牛奶', calories: 54, protein: 3.0, carbs: 3.4, fat: 3.2 },
  { id: 'f005', name: '苹果', calories: 52, protein: 0.2, carbs: 13.5, fat: 0.2 },
  { id: 'f006', name: '香蕉', calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
  { id: 'f007', name: '面包', calories: 312, protein: 8.3, carbs: 58.6, fat: 5.1 },
  { id: 'f008', name: '面条', calories: 284, protein: 8.5, carbs: 56.8, fat: 2.1 },
  { id: 'f009', name: '牛肉', calories: 125, protein: 19.9, carbs: 2.0, fat: 4.2 },
  { id: 'f010', name: '猪肉', calories: 395, protein: 13.2, carbs: 2.4, fat: 37.0 },
  { id: 'f011', name: '鱼肉', calories: 113, protein: 18.0, carbs: 0.0, fat: 4.3 },
  { id: 'f012', name: '西兰花', calories: 33, protein: 4.1, carbs: 4.3, fat: 0.6 },
  { id: 'f013', name: '胡萝卜', calories: 37, protein: 1.0, carbs: 8.8, fat: 0.2 },
  { id: 'f014', name: '番茄', calories: 19, protein: 0.9, carbs: 4.0, fat: 0.2 },
  { id: 'f015', name: '土豆', calories: 77, protein: 2.0, carbs: 17.2, fat: 0.1 },
  { id: 'f016', name: '豆腐', calories: 76, protein: 8.1, carbs: 3.8, fat: 3.7 },
  { id: 'f017', name: '豆浆', calories: 54, protein: 3.0, carbs: 5.0, fat: 1.8 },
  { id: 'f018', name: '花生', calories: 563, protein: 24.8, carbs: 21.7, fat: 44.3 },
  { id: 'f019', name: '燕麦', calories: 367, protein: 15.0, carbs: 61.6, fat: 6.7 },
  { id: 'f020', name: '酸奶', calories: 72, protein: 2.5, carbs: 9.3, fat: 2.7 },
]

const logsStorage = new Map<string, LogEntry[]>()

function findFoodById(foodId: string): FoodItem | undefined {
  return foodDatabase.find((food) => food.id === foodId)
}

function calculateNutrition(food: FoodItem, grams: number): {
  calories: number
  protein: number
  carbs: number
  fat: number
} {
  const ratio = grams / 100
  return {
    calories: Number((food.calories * ratio).toFixed(2)),
    protein: Number((food.protein * ratio).toFixed(2)),
    carbs: Number((food.carbs * ratio).toFixed(2)),
    fat: Number((food.fat * ratio).toFixed(2)),
  }
}

function sumEntries(entries: LogEntry[]): {
  calories: number
  protein: number
  carbs: number
  fat: number
} {
  return entries.reduce(
    (acc, entry) => ({
      calories: Number((acc.calories + entry.calories).toFixed(2)),
      protein: Number((acc.protein + entry.protein).toFixed(2)),
      carbs: Number((acc.carbs + entry.carbs).toFixed(2)),
      fat: Number((acc.fat + entry.fat).toFixed(2)),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function searchFoods(query: string): FoodItem[] {
  if (!query.trim()) {
    return foodDatabase
  }
  const lowerQuery = query.toLowerCase()
  return foodDatabase.filter((food) =>
    food.name.toLowerCase().includes(lowerQuery)
  )
}

export async function addLog(
  userId: string,
  foodId: string,
  grams: number,
  mealType: MealType,
  date: string
): Promise<{ success: boolean; entry?: LogEntry; error?: string }> {
  try {
    const food = findFoodById(foodId)
    if (!food) {
      return { success: false, error: '食物不存在' }
    }

    if (grams <= 0) {
      return { success: false, error: '份量必须大于0' }
    }

    const nutrition = calculateNutrition(food, grams)

    const entry: LogEntry = {
      id: uuidv4(),
      userId,
      foodId,
      foodName: food.name,
      mealType,
      grams,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      date,
    }

    const userLogs = logsStorage.get(userId) ?? []
    userLogs.push(entry)
    logsStorage.set(userId, userLogs)

    return { success: true, entry }
  } catch {
    return { success: false, error: '添加日志失败' }
  }
}

export function getLogsByDate(
  userId: string,
  date: string
): {
  entries: LogEntry[]
  totals: { calories: number; protein: number; carbs: number; fat: number }
} {
  const userLogs = logsStorage.get(userId) ?? []
  const entries = userLogs.filter((log) => log.date === date)
  const totals = sumEntries(entries)
  return { entries, totals }
}

export async function deleteLog(
  logId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    for (const [userId, logs] of logsStorage.entries()) {
      const index = logs.findIndex((log) => log.id === logId)
      if (index !== -1) {
        logs.splice(index, 1)
        logsStorage.set(userId, logs)
        return { success: true }
      }
    }
    return { success: false, error: '日志不存在' }
  } catch {
    return { success: false, error: '删除日志失败' }
  }
}

export function getWeeklyReport(userId: string): {
  dailyTrend: { date: string; calories: number }[]
  avgNutrition: { protein: number; carbs: number; fat: number }
} {
  const userLogs = logsStorage.get(userId) ?? []
  const today = new Date()
  const dailyTrend: { date: string; calories: number }[] = []
  const allWeekEntries: LogEntry[] = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = formatDate(date)

    const dayEntries = userLogs.filter((log) => log.date === dateStr)
    const dayTotals = sumEntries(dayEntries)

    dailyTrend.push({
      date: dateStr,
      calories: dayTotals.calories,
    })

    allWeekEntries.push(...dayEntries)
  }

  const weekTotals = sumEntries(allWeekEntries)
  const avgNutrition = {
    protein: Number((weekTotals.protein / 7).toFixed(2)),
    carbs: Number((weekTotals.carbs / 7).toFixed(2)),
    fat: Number((weekTotals.fat / 7).toFixed(2)),
  }

  return { dailyTrend, avgNutrition }
}
