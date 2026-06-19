import { format, differenceInDays, addDays as dateFnsAddDays, formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function formatDate(date: string | Date, formatStr: string = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, formatStr, { locale: zhCN })
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN })
}

export function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  return Math.abs(differenceInDays(d1, d2))
}

export function addDays(date: string | Date, days: number): Date {
  const d = typeof date === 'string' ? new Date(date) : date
  return dateFnsAddDays(d, days)
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

export function generateGradient(seed: string): string {
  const hash = hashString(seed)
  const baseHue = 100 + (hash % 60)
  const hue1 = baseHue
  const hue2 = (baseHue + 20 + (hash % 30)) % 360
  const saturation = 45 + (hash % 20)
  const lightness1 = 55 + (hash % 15)
  const lightness2 = 40 + (hash % 15)

  return `linear-gradient(135deg, hsl(${hue1}, ${saturation}%, ${lightness1}%) 0%, hsl(${hue2}, ${saturation}%, ${lightness2}%) 100%)`
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
