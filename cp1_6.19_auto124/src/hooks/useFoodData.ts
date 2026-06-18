import { useState, useMemo, useCallback } from 'react'

export type FoodCategory = 'staple' | 'meat' | 'vegetable' | 'fruit' | 'dairy'

export interface FoodItem {
  id: string
  name: string
  category: FoodCategory
  per100g: {
    calories: number
    protein: number
    fat: number
    carbs: number
  }
}

export interface FoodRecord {
  id: string
  foodId: string
  name: string
  category: FoodCategory
  grams: number
  nutrition: {
    calories: number
    protein: number
    fat: number
    carbs: number
  }
  timestamp: number
}

export interface DailyNutrition {
  calories: number
  protein: number
  fat: number
  carbs: number
}

export interface TrendDataPoint {
  date: string
  calories: number
}

export const FOOD_LIBRARY: FoodItem[] = [
  { id: '1', name: '白米饭', category: 'staple', per100g: { calories: 116, protein: 2.6, fat: 0.3, carbs: 25.6 } },
  { id: '2', name: '馒头', category: 'staple', per100g: { calories: 223, protein: 7, fat: 1.1, carbs: 47 } },
  { id: '3', name: '面条', category: 'staple', per100g: { calories: 109, protein: 4.5, fat: 0.5, carbs: 22 } },
  { id: '4', name: '面包', category: 'staple', per100g: { calories: 312, protein: 8.3, fat: 5.1, carbs: 58.6 } },
  { id: '5', name: '燕麦片', category: 'staple', per100g: { calories: 367, protein: 15, fat: 6.7, carbs: 61.6 } },
  { id: '6', name: '红薯', category: 'staple', per100g: { calories: 99, protein: 1.1, fat: 0.2, carbs: 23.1 } },
  { id: '7', name: '玉米', category: 'staple', per100g: { calories: 112, protein: 4, fat: 1.2, carbs: 22.8 } },
  { id: '8', name: '糙米', category: 'staple', per100g: { calories: 348, protein: 7.7, fat: 2.7, carbs: 75 } },
  { id: '9', name: '小米粥', category: 'staple', per100g: { calories: 46, protein: 1.4, fat: 0.7, carbs: 8.4 } },
  { id: '10', name: '饺子', category: 'staple', per100g: { calories: 253, protein: 8.5, fat: 11, carbs: 30 } },

  { id: '11', name: '鸡胸肉', category: 'meat', per100g: { calories: 133, protein: 19.4, fat: 5, carbs: 2.5 } },
  { id: '12', name: '猪肉', category: 'meat', per100g: { calories: 395, protein: 13.2, fat: 37, carbs: 2.4 } },
  { id: '13', name: '牛肉', category: 'meat', per100g: { calories: 125, protein: 19.9, fat: 4.2, carbs: 2 } },
  { id: '14', name: '羊肉', category: 'meat', per100g: { calories: 203, protein: 19, fat: 14.1, carbs: 0 } },
  { id: '15', name: '鸡腿', category: 'meat', per100g: { calories: 181, protein: 16, fat: 13, carbs: 0 } },
  { id: '16', name: '鸭肉', category: 'meat', per100g: { calories: 240, protein: 15.5, fat: 19.7, carbs: 0.2 } },
  { id: '17', name: '三文鱼', category: 'meat', per100g: { calories: 139, protein: 17.2, fat: 7.8, carbs: 0 } },
  { id: '18', name: '虾', category: 'meat', per100g: { calories: 93, protein: 18.6, fat: 0.8, carbs: 2.8 } },
  { id: '19', name: '鸡蛋', category: 'meat', per100g: { calories: 144, protein: 13.3, fat: 8.8, carbs: 2.8 } },
  { id: '20', name: '培根', category: 'meat', per100g: { calories: 541, protein: 22.3, fat: 47, carbs: 2 } },

  { id: '21', name: '西兰花', category: 'vegetable', per100g: { calories: 33, protein: 4.1, fat: 0.6, carbs: 4.3 } },
  { id: '22', name: '胡萝卜', category: 'vegetable', per100g: { calories: 37, protein: 1, fat: 0.2, carbs: 8.8 } },
  { id: '23', name: '菠菜', category: 'vegetable', per100g: { calories: 24, protein: 2.6, fat: 0.3, carbs: 4.5 } },
  { id: '24', name: '西红柿', category: 'vegetable', per100g: { calories: 19, protein: 0.9, fat: 0.2, carbs: 4 } },
  { id: '25', name: '黄瓜', category: 'vegetable', per100g: { calories: 16, protein: 0.8, fat: 0.2, carbs: 2.9 } },
  { id: '26', name: '白菜', category: 'vegetable', per100g: { calories: 17, protein: 1.5, fat: 0.1, carbs: 3.2 } },
  { id: '27', name: '茄子', category: 'vegetable', per100g: { calories: 23, protein: 1.1, fat: 0.2, carbs: 4.9 } },
  { id: '28', name: '青椒', category: 'vegetable', per100g: { calories: 22, protein: 1, fat: 0.2, carbs: 5.4 } },
  { id: '29', name: '土豆', category: 'vegetable', per100g: { calories: 81, protein: 2.6, fat: 0.2, carbs: 17.8 } },
  { id: '30', name: '洋葱', category: 'vegetable', per100g: { calories: 40, protein: 1.1, fat: 0.2, carbs: 9.3 } },

  { id: '31', name: '苹果', category: 'fruit', per100g: { calories: 54, protein: 0.2, fat: 0.2, carbs: 13.5 } },
  { id: '32', name: '香蕉', category: 'fruit', per100g: { calories: 93, protein: 1.4, fat: 0.2, carbs: 22 } },
  { id: '33', name: '橙子', category: 'fruit', per100g: { calories: 48, protein: 0.8, fat: 0.2, carbs: 11.1 } },
  { id: '34', name: '葡萄', category: 'fruit', per100g: { calories: 44, protein: 0.5, fat: 0.2, carbs: 10.3 } },
  { id: '35', name: '西瓜', category: 'fruit', per100g: { calories: 25, protein: 0.6, fat: 0.1, carbs: 5.8 } },
  { id: '36', name: '草莓', category: 'fruit', per100g: { calories: 32, protein: 1, fat: 0.2, carbs: 7.1 } },
  { id: '37', name: '蓝莓', category: 'fruit', per100g: { calories: 57, protein: 0.7, fat: 0.3, carbs: 14.5 } },
  { id: '38', name: '芒果', category: 'fruit', per100g: { calories: 32, protein: 0.6, fat: 0.2, carbs: 8.3 } },
  { id: '39', name: '梨', category: 'fruit', per100g: { calories: 51, protein: 0.4, fat: 0.2, carbs: 13.3 } },
  { id: '40', name: '猕猴桃', category: 'fruit', per100g: { calories: 56, protein: 0.8, fat: 0.6, carbs: 14.5 } },

  { id: '41', name: '牛奶', category: 'dairy', per100g: { calories: 54, protein: 3, fat: 3.2, carbs: 3.4 } },
  { id: '42', name: '酸奶', category: 'dairy', per100g: { calories: 72, protein: 2.5, fat: 2.7, carbs: 9.3 } },
  { id: '43', name: '奶酪', category: 'dairy', per100g: { calories: 328, protein: 25.7, fat: 23.5, carbs: 3.5 } },
  { id: '44', name: '豆浆', category: 'dairy', per100g: { calories: 30, protein: 1.8, fat: 0.7, carbs: 1.1 } },
  { id: '45', name: '黄油', category: 'dairy', per100g: { calories: 888, protein: 1.4, fat: 98, carbs: 0 } },
  { id: '46', name: '全脂奶粉', category: 'dairy', per100g: { calories: 478, protein: 20.1, fat: 21.2, carbs: 51.7 } },
  { id: '47', name: '淡奶油', category: 'dairy', per100g: { calories: 346, protein: 2.5, fat: 36.1, carbs: 3.3 } },
  { id: '48', name: '炼乳', category: 'dairy', per100g: { calories: 332, protein: 8.1, fat: 8.7, carbs: 55.4 } },
  { id: '49', name: '羊奶', category: 'dairy', per100g: { calories: 59, protein: 1.5, fat: 3.5, carbs: 5.4 } },
  { id: '50', name: '马苏里拉奶酪', category: 'dairy', per100g: { calories: 280, protein: 25, fat: 18, carbs: 3.2 } },
]

export const CATEGORY_COLORS: Record<FoodCategory, string> = {
  staple: '#F39C12',
  meat: '#E74C3C',
  vegetable: '#27AE60',
  fruit: '#8E44AD',
  dairy: '#3498DB',
}

export const CATEGORY_NAMES: Record<FoodCategory, string> = {
  staple: '主食',
  meat: '肉类',
  vegetable: '蔬菜',
  fruit: '水果',
  dairy: '乳制品',
}

export const CALORIE_TARGET = 2000
export const PROTEIN_TARGET = 60
export const FAT_TARGET = 65
export const CARBS_TARGET = 300

const generateSampleData = (): FoodRecord[] => {
  const records: FoodRecord[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStart = today.getTime()

  const todayFoods = [
    { foodId: '1', grams: 200 },
    { foodId: '19', grams: 100 },
    { foodId: '21', grams: 150 },
    { foodId: '11', grams: 120 },
    { foodId: '31', grams: 180 },
    { foodId: '41', grams: 250 },
  ]

  todayFoods.forEach((f, idx) => {
    const food = FOOD_LIBRARY.find(item => item.id === f.foodId)!
    records.push({
      id: `sample-today-${idx}`,
      foodId: food.id,
      name: food.name,
      category: food.category,
      grams: f.grams,
      nutrition: {
        calories: (food.per100g.calories * f.grams) / 100,
        protein: (food.per100g.protein * f.grams) / 100,
        fat: (food.per100g.fat * f.grams) / 100,
        carbs: (food.per100g.carbs * f.grams) / 100,
      },
      timestamp: todayStart + 3600000 * (8 + idx * 2) + idx * 60000,
    })
  })

  const pastCalories = [1850, 2100, 1750, 2200, 1900, 2050]
  for (let day = 1; day <= 6; day++) {
    const dayStart = todayStart - day * 86400000
    const targetCal = pastCalories[day - 1]
    let currentCal = 0
    let idx = 0
    while (currentCal < targetCal && idx < FOOD_LIBRARY.length) {
      const food = FOOD_LIBRARY[Math.floor(Math.random() * FOOD_LIBRARY.length)]
      const grams = [100, 150, 200, 80, 120][Math.floor(Math.random() * 5)]
      const cal = (food.per100g.calories * grams) / 100
      if (currentCal + cal > targetCal * 1.1) {
        idx++
        continue
      }
      records.push({
        id: `sample-past-${day}-${idx}`,
        foodId: food.id,
        name: food.name,
        category: food.category,
        grams,
        nutrition: {
          calories: cal,
          protein: (food.per100g.protein * grams) / 100,
          fat: (food.per100g.fat * grams) / 100,
          carbs: (food.per100g.carbs * grams) / 100,
        },
        timestamp: dayStart + 3600000 * (8 + Math.floor(Math.random() * 10)),
      })
      currentCal += cal
      idx++
    }
  }

  return records.sort((a, b) => b.timestamp - a.timestamp)
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const useFoodData = () => {
  const [records, setRecords] = useState<FoodRecord[]>(() => generateSampleData())

  const searchFoods = useCallback((query: string): FoodItem[] => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return []
    return FOOD_LIBRARY.filter(food =>
      food.name.toLowerCase().includes(trimmed) ||
      CATEGORY_NAMES[food.category].toLowerCase().includes(trimmed)
    )
  }, [])

  const addRecord = useCallback((food: FoodItem, grams: number) => {
    const record: FoodRecord = {
      id: generateId(),
      foodId: food.id,
      name: food.name,
      category: food.category,
      grams,
      nutrition: {
        calories: (food.per100g.calories * grams) / 100,
        protein: (food.per100g.protein * grams) / 100,
        fat: (food.per100g.fat * grams) / 100,
        carbs: (food.per100g.carbs * grams) / 100,
      },
      timestamp: Date.now(),
    }
    setRecords(prev => [record, ...prev].sort((a, b) => b.timestamp - a.timestamp))
  }, [])

  const updateRecord = useCallback((recordId: string, newGrams: number) => {
    setRecords(prev =>
      prev.map(r => {
        if (r.id !== recordId) return r
        const food = FOOD_LIBRARY.find(f => f.id === r.foodId)!
        return {
          ...r,
          grams: newGrams,
          nutrition: {
            calories: (food.per100g.calories * newGrams) / 100,
            protein: (food.per100g.protein * newGrams) / 100,
            fat: (food.per100g.fat * newGrams) / 100,
            carbs: (food.per100g.carbs * newGrams) / 100,
          },
        }
      })
    )
  }, [])

  const deleteRecord = useCallback((recordId: string) => {
    setRecords(prev => prev.filter(r => r.id !== recordId))
  }, [])

  const todayNutrition = useMemo((): DailyNutrition => {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    const todayEnd = todayStart + 86400000

    return records
      .filter(r => r.timestamp >= todayStart && r.timestamp < todayEnd)
      .reduce(
        (acc, r) => ({
          calories: acc.calories + r.nutrition.calories,
          protein: acc.protein + r.nutrition.protein,
          fat: acc.fat + r.nutrition.fat,
          carbs: acc.carbs + r.nutrition.carbs,
        }),
        { calories: 0, protein: 0, fat: 0, carbs: 0 }
      )
  }, [records])

  const todayRecords = useMemo(() => {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    const todayEnd = todayStart + 86400000
    return records.filter(r => r.timestamp >= todayStart && r.timestamp < todayEnd)
  }, [records])

  const suggestionText = useMemo((): string => {
    const { calories, protein, fat, carbs } = todayNutrition
    const tips: string[] = []

    if (calories < CALORIE_TARGET * 0.6) {
      tips.push('今日热量摄入偏低，建议适当增加餐食')
    } else if (calories > CALORIE_TARGET * 1.1) {
      tips.push('热量摄入已超标，建议控制后续饮食')
    }

    if (protein < PROTEIN_TARGET * 0.6) {
      tips.push('蛋白质摄入偏低，建议晚餐补充豆制品或鸡胸肉')
    } else if (protein > PROTEIN_TARGET * 1.2) {
      tips.push('蛋白质摄入充足，注意均衡其他营养素')
    }

    if (fat > FAT_TARGET * 1.1) {
      tips.push('脂肪摄入偏高，建议减少油腻食物')
    } else if (fat < FAT_TARGET * 0.5) {
      tips.push('脂肪摄入偏低，可适量补充坚果或牛油果')
    }

    if (carbs < CARBS_TARGET * 0.5) {
      tips.push('碳水摄入不足，建议增加主食或水果')
    } else if (carbs > CARBS_TARGET * 1.1) {
      tips.push('碳水摄入偏高，建议控制精制主食')
    }

    if (tips.length === 0) {
      tips.push('当前营养摄入均衡，继续保持！')
    }

    return tips[0]
  }, [todayNutrition])

  const trendData = useMemo((): TrendDataPoint[] => {
    const data: TrendDataPoint[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 86400000)
      const dateStart = date.getTime()
      const dateEnd = dateStart + 86400000
      const dayRecords = records.filter(r => r.timestamp >= dateStart && r.timestamp < dateEnd)
      const totalCalories = dayRecords.reduce((sum, r) => sum + r.nutrition.calories, 0)
      const month = date.getMonth() + 1
      const day = date.getDate()
      data.push({
        date: `${month}/${day}`,
        calories: Math.round(totalCalories),
      })
    }
    return data
  }, [records])

  return {
    records,
    todayRecords,
    todayNutrition,
    suggestionText,
    trendData,
    searchFoods,
    addRecord,
    updateRecord,
    deleteRecord,
  }
}
