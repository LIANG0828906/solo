import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: number): string {
  const d = new Date(date)
  const now = Date.now()
  const diff = now - date

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
  if (diff < day) return `${Math.floor(diff / hour)}小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)}天前`

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const dayNum = String(d.getDate()).padStart(2, '0')

  const currentYear = new Date().getFullYear()
  if (year === currentYear) return `${month}-${dayNum}`
  return `${year}-${month}-${dayNum}`
}

export const categoryLabels: Record<string, string> = {
  electronics: '电子',
  furniture: '家具',
  books: '书籍',
  clothing: '衣物',
  other: '其他',
}

export const conditionLabels: Record<string, string> = {
  'new': '全新',
  'like-new': '几乎全新',
  'good': '良好',
  'fair': '一般',
  'poor': '较差',
}

export const statusConfig: Record<string, { label: string; color: string }> = {
  available: { label: '待交换', color: 'bg-blue-500' },
  exchanged: { label: '已交换', color: 'bg-green-500' },
  offline: { label: '已下架', color: 'bg-gray-400' },
}
