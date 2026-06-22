export type ChartType = 'line' | 'bar' | 'pie' | 'area'

export interface LineChartData {
  timestamps: string[]
  values: number[]
}

export interface BarChartData {
  categories: string[]
  values: number[]
}

export interface PieChartData {
  items: Array<{ name: string; value: number }>
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function generateTimestamps(count: number): string[] {
  const now = new Date()
  const timestamps: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5000)
    timestamps.push(formatTimestamp(time))
  }
  return timestamps
}

function randomInRange(min: number, max: number): number {
  return Math.round(Math.random() * (max - min) + min)
}

export function generateLineData(): LineChartData {
  const count = 10
  const timestamps = generateTimestamps(count)
  const values: number[] = []
  let lastValue = randomInRange(30, 70)
  
  for (let i = 0; i < count; i++) {
    const change = randomInRange(-10, 10)
    let newValue = lastValue + change
    newValue = Math.max(20, Math.min(80, newValue))
    values.push(newValue)
    lastValue = newValue
  }
  
  return { timestamps, values }
}

export function generateBarData(): BarChartData {
  const categories = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const values = categories.map(() => randomInRange(10, 100))
  return { categories, values }
}

export function generatePieData(): PieChartData {
  const names = ['产品A', '产品B', '产品C', '产品D', '产品E']
  const rawValues = names.map(() => randomInRange(10, 50))
  const total = rawValues.reduce((a, b) => a + b, 0)
  
  const items = names.map((name, index) => ({
    name,
    value: Math.round((rawValues[index] / total) * 100)
  }))
  
  const sum = items.reduce((a, b) => a + b.value, 0)
  if (sum !== 100) {
    items[items.length - 1].value += (100 - sum)
  }
  
  return { items }
}

export function generateAreaData(): LineChartData {
  return generateLineData()
}

export function generateChartData(type: ChartType): LineChartData | BarChartData | PieChartData {
  switch (type) {
    case 'line':
      return generateLineData()
    case 'bar':
      return generateBarData()
    case 'pie':
      return generatePieData()
    case 'area':
      return generateAreaData()
    default:
      return generateLineData()
  }
}

export const colorThemes = {
  blue: {
    primary: '#2980B9',
    secondary: '#3498DB',
    gradient: ['#2980B9', '#3498DB', '#5DADE2', '#85C1E9'],
    name: '经典蓝'
  },
  green: {
    primary: '#27AE60',
    secondary: '#2ECC71',
    gradient: ['#27AE60', '#2ECC71', '#58D68D', '#82E0AA'],
    name: '森林绿'
  },
  orange: {
    primary: '#E67E22',
    secondary: '#F39C12',
    gradient: ['#E67E22', '#F39C12', '#F5B041', '#F8C471'],
    name: '日落橙'
  },
  purple: {
    primary: '#8E44AD',
    secondary: '#9B59B6',
    gradient: ['#8E44AD', '#9B59B6', '#AF7AC5', '#C39BD3'],
    name: '薰衣草'
  }
} as const

export type ColorThemeKey = keyof typeof colorThemes
