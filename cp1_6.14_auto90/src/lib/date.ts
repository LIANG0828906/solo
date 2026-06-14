export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function addDays(iso: string, delta: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().split('T')[0]
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function formatDateWeekday(iso: string): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const d = new Date(iso + 'T00:00:00')
  return weekdays[d.getDay()]
}

export function formatMMSS(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function getWeekRange(anchorISO?: string): { start: string; end: string; days: string[] } {
  const base = anchorISO ? new Date(anchorISO + 'T00:00:00') : new Date()
  const dayOfWeek = base.getDay()
  const monday = new Date(base)
  monday.setDate(base.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  const days: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d.toISOString().split('T')[0])
  }
  return { start: days[0], end: days[6], days }
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export function isSameDay(a: string, b: string): boolean {
  return a.split('T')[0] === b.split('T')[0]
}
