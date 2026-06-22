import { differenceInDays, format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function getGrowthDays(plantDate: string): number {
  const start = new Date(plantDate)
  const today = new Date()
  return Math.max(0, differenceInDays(today, start))
}

export function formatDate(dateString: string): string {
  return format(new Date(dateString), 'yyyy年MM月dd日', { locale: zhCN })
}

export function formatDateTime(dateString: string): string {
  return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
}

export function formatShortDate(dateString: string): string {
  return format(new Date(dateString), 'MM/dd', { locale: zhCN })
}

export function getCurrentISOString(): string {
  return new Date().toISOString()
}
