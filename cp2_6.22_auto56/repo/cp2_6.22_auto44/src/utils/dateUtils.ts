export const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i) // 8..20
export const HOUR_HEIGHT = 60

export function getWeekDates(base = new Date()): Date[] {
  const d = new Date(base)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(d)
    nd.setDate(nd.getDate() + i)
    return nd
  })
}

export function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`
}

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function buildDateTime(date: Date, hour: number, minute = 0) {
  const d = new Date(date)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export function parseHour(iso: string) {
  const d = new Date(iso)
  return d.getHours() + d.getMinutes() / 60
}

export function isSameDay(a: Date, iso: string) {
  const d = new Date(iso)
  return (
    a.getFullYear() === d.getFullYear() &&
    a.getMonth() === d.getMonth() &&
    a.getDate() === d.getDate()
  )
}

export function formatDateShort(d: Date) {
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`
}

export function weekdayLabel(d: Date) {
  return ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][
    (d.getDay() + 6) % 7
  ]
}

export function formatDateTimeRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  return `${toISODate(s)} ${formatTime(s)} - ${formatTime(e)}`
}

export function humanizeDeviceType(t: string) {
  return (
    {
      projector: '投影仪',
      whiteboard: '白板',
      video_conference: '视频会议系统',
    } as Record<string, string>
  )[t] || t
}
