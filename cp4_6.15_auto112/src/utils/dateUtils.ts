const BASE_YEAR = 2024

const SOLAR_TERMS: Array<{ name: string; dayOfYear: number; spread: number }> = [
  { name: '春分', dayOfYear: 80, spread: 2 },
  { name: '夏至', dayOfYear: 172, spread: 2 },
  { name: '秋分', dayOfYear: 265, spread: 2 },
  { name: '冬至', dayOfYear: 355, spread: 2 },
]

export function dayOfYearToDate(dayOfYear: number): Date {
  const date = new Date(BASE_YEAR, 0, 1)
  date.setDate(dayOfYear)
  return date
}

export function formatDate(dayOfYear: number): string {
  const date = dayOfYearToDate(dayOfYear)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

export function formatTime(hour: number): string {
  const h = Math.floor(hour)
  const m = Math.floor((hour - h) * 60)
  const hh = h.toString().padStart(2, '0')
  const mm = m.toString().padStart(2, '0')
  return `${hh}:${mm}`
}

export function getSolarTerm(dayOfYear: number): string | null {
  for (const term of SOLAR_TERMS) {
    if (Math.abs(dayOfYear - term.dayOfYear) <= term.spread) {
      return term.name
    }
  }
  return null
}

export function getSeason(dayOfYear: number): 'spring' | 'summer' | 'autumn' | 'winter' {
  if (dayOfYear >= 80 && dayOfYear < 172) {
    return 'spring'
  } else if (dayOfYear >= 172 && dayOfYear < 265) {
    return 'summer'
  } else if (dayOfYear >= 265 && dayOfYear < 355) {
    return 'autumn'
  } else {
    return 'winter'
  }
}
