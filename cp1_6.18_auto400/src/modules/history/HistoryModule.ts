import type { GeneratedPoem } from '../generation/GeneratorModule'
import type { StyleConfig } from '../styling/StyleModule'
import { defaultStyle, encodeStyleToQuery, decodeStyleFromQuery } from '../styling/StyleModule'

export interface HistoryItem {
  id: string
  poem: GeneratedPoem
  style: StyleConfig
  shareCode: string
  createdAt: number
}

const STORAGE_KEY = 'shijing_history'
const MAX_ITEMS = 100

export function encodePoemToQuery(poem: GeneratedPoem): string {
  const params = new URLSearchParams({
    p: poem.lines.join('|'),
    a: poem.author,
    k: poem.keyword,
    t: poem.lineType
  })
  return params.toString()
}

export function decodePoemFromQuery(query: string): GeneratedPoem | null {
  try {
    const params = new URLSearchParams(query)
    const linesStr = params.get('p')
    if (!linesStr) return null

    const lines = linesStr.split('|')
    if (lines.length !== 4) return null

    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      lines,
      type: 'jueju',
      lineType: (params.get('t') as 'seven' | 'five') || 'seven',
      author: params.get('a') || '佚名',
      keyword: params.get('k') || '无题',
      timestamp: Date.now()
    }
  } catch {
    return null
  }
}

export function generateShareCode(poem: GeneratedPoem, style: StyleConfig): string {
  const poemPart = encodePoemToQuery(poem)
  const stylePart = encodeStyleToQuery(style)
  return `${poemPart}&${stylePart}`
}

export function parseShareCode(code: string): { poem: GeneratedPoem | null; style: StyleConfig } {
  const poem = decodePoemFromQuery(code)
  const style = decodeStyleFromQuery(code)
  return { poem, style }
}

export function saveToHistory(poem: GeneratedPoem, style: StyleConfig): HistoryItem {
  const history = loadHistory()
  const item: HistoryItem = {
    id: poem.id,
    poem,
    style,
    shareCode: generateShareCode(poem, style),
    createdAt: Date.now()
  }

  history.unshift(item)
  if (history.length > MAX_ITEMS) {
    history.length = MAX_ITEMS
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (e) {
    console.warn('Failed to save history:', e)
  }

  return item
}

export function loadHistory(): HistoryItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    const parsed = JSON.parse(data) as HistoryItem[]
    return parsed.sort((a, b) => b.createdAt - a.createdAt)
  } catch (e) {
    console.warn('Failed to load history:', e)
    return []
  }
}

export function deleteFromHistory(id: string): HistoryItem[] {
  const history = loadHistory().filter(item => item.id !== id)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (e) {
    console.warn('Failed to delete from history:', e)
  }
  return history
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.warn('Failed to clear history:', e)
  }
}

export function getHistoryById(id: string): HistoryItem | null {
  const history = loadHistory()
  return history.find(item => item.id === id) || null
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}
