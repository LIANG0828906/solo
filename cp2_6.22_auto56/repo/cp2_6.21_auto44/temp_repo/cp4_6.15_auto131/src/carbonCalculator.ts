export type Category = 'transport' | 'food' | 'electricity'

export type ActivityItem = {
  id: string
  category: Category
  name: string
  carbonKg: number
}

const emissionFactors: Record<Category, Record<string, number>> = {
  transport: {
    '步行1公里': 0,
    '骑行1公里': 0,
    '公交10公里': 0.6,
    '地铁10公里': 0.5,
    '开车10公里': 2.3,
    '飞行100公里': 25.0,
    '电动车10公里': 0.2,
  },
  food: {
    '素食一餐': 0.3,
    '鸡肉一餐': 1.2,
    '猪肉一餐': 1.8,
    '牛肉汉堡': 3.5,
    '牛肉一餐': 6.6,
    '海鲜一餐': 1.5,
    '沙拉': 0.2,
  },
  electricity: {
    '空调1小时': 0.8,
    '电脑8小时': 0.6,
    '电视3小时': 0.3,
    '洗衣机一次': 0.4,
    '照明一天': 0.2,
    '充电器一天': 0.05,
    '冰箱一天': 1.2,
  },
}

export function calculateCarbon(category: Category, activityName: string): number {
  return emissionFactors[category][activityName] ?? 0
}

export function getCategoryActivities(category: Category): string[] {
  return Object.keys(emissionFactors[category])
}

export function getCarbonLevel(totalKg: number): 'low' | 'medium' | 'high' {
  if (totalKg <= 5) return 'low'
  if (totalKg <= 10) return 'medium'
  return 'high'
}

export function getCarbonColor(totalKg: number): string {
  const green = { r: 76, g: 175, b: 80 }
  const orange = { r: 255, g: 152, b: 0 }
  const red = { r: 244, g: 67, b: 54 }

  const t = Math.min(Math.max(totalKg, 0), 10)
  let from: { r: number; g: number; b: number }
  let to: { r: number; g: number; b: number }
  let ratio: number

  if (t <= 5) {
    from = green
    to = orange
    ratio = t / 5
  } else {
    from = orange
    to = red
    ratio = (t - 5) / 5
  }

  const r = Math.round(from.r + (to.r - from.r) * ratio)
  const g = Math.round(from.g + (to.g - from.g) * ratio)
  const b = Math.round(from.b + (to.b - from.b) * ratio)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
