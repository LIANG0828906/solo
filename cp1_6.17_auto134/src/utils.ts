export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export const SEASON_COLORS: Record<Season, string> = {
  spring: '#27AE60',
  summer: '#F39C12',
  autumn: '#E67E22',
  winter: '#3498DB'
}

export const getSeasonColor = (season: Season): string => {
  return SEASON_COLORS[season]
}

export const formatDate = (month: number, day: number): string => {
  return `${month}月${day}日`
}

export const getMonthDays = (month: number, year: number = new Date().getFullYear()): number => {
  return new Date(year, month, 0).getDate()
}

export const getMonthName = (month: number): string => {
  const names = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  return names[month - 1] || ''
}

export const getWeekDay = (year: number, month: number, day: number): number => {
  return new Date(year, month - 1, day).getDay()
}

export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t
}

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value))
}

export const CITY_COORDS: Record<string, { x: number; y: number }> = {
  '北京': { x: 520, y: 180 },
  '上海': { x: 620, y: 340 },
  '广州': { x: 560, y: 460 },
  '深圳': { x: 555, y: 475 },
  '成都': { x: 400, y: 350 },
  '重庆': { x: 430, y: 370 },
  '杭州': { x: 605, y: 345 },
  '南京': { x: 585, y: 320 },
  '武汉': { x: 525, y: 345 },
  '西安': { x: 450, y: 290 },
  '苏州': { x: 610, y: 340 },
  '天津': { x: 530, y: 195 },
  '长沙': { x: 520, y: 400 },
  '郑州': { x: 500, y: 280 },
  '青岛': { x: 560, y: 240 },
  '大连': { x: 580, y: 180 },
  '沈阳': { x: 590, y: 140 },
  '哈尔滨': { x: 620, y: 80 },
  '昆明': { x: 410, y: 430 },
  '厦门': { x: 590, y: 440 },
  '福州': { x: 595, y: 420 },
  '济南': { x: 530, y: 250 },
  '合肥': { x: 565, y: 330 },
  '南昌': { x: 560, y: 390 }
}

export const getCityCoords = (city: string): { x: number; y: number } => {
  return CITY_COORDS[city] || { x: 500, y: 300 }
}
