import type { Bookmark } from '../parser/bookmarkParser'
import { parseBookmarksCSV, parseBookmarksJSON } from '../parser/bookmarkParser'

export interface Tag {
  name: string
  color: string
}

const BOOKMARKS_KEY = 'bookmark_manager_bookmarks'
const TAGS_KEY = 'bookmark_manager_tags'

export function saveBookmarks(bookmarks: Bookmark[]): void {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks))
  } catch (e) {
    console.error('Failed to save bookmarks:', e)
  }
}

export function loadBookmarks(): Bookmark[] {
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY)
    if (!data) return []
    const parsed = JSON.parse(data)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.error('Failed to load bookmarks:', e)
    return []
  }
}

export function saveTags(tags: Tag[]): void {
  try {
    localStorage.setItem(TAGS_KEY, JSON.stringify(tags))
  } catch (e) {
    console.error('Failed to save tags:', e)
  }
}

export function loadTags(): Tag[] {
  try {
    const data = localStorage.getItem(TAGS_KEY)
    if (!data) return []
    const parsed = JSON.parse(data)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.error('Failed to load tags:', e)
    return []
  }
}

export interface ImportResult {
  success: Bookmark[]
  errors: number
}

export function importFromContent(content: string, type: 'csv' | 'json'): ImportResult {
  if (type === 'csv') {
    return parseBookmarksCSV(content)
  } else {
    return parseBookmarksJSON(content)
  }
}

export function getFaviconUrl(url: string): string {
  try {
    const u = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`
  } catch {
    return ''
  }
}

export function getDomain(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}个月前`

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateFull(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}年${month}月${day}日`
}

export function formatFolderPath(path: string): string {
  if (!path || path === '/') return '根目录'
  return path.split('/').filter(p => p).join(' / ')
}

export function truncateFolderPath(path: string, maxLevels: number = 2): string {
  if (!path || path === '/') return '根目录'

  const parts = path.split('/').filter(p => p)
  if (parts.length <= maxLevels) {
    return parts.join(' / ')
  }

  const lastParts = parts.slice(-maxLevels)
  return '... / ' + lastParts.join(' / ')
}

export const DEFAULT_BOOKMARK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234a90d9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`

export function hashToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 70%, 55%)`
}

export function mergeBookmarks(existing: Bookmark[], imported: Bookmark[]): Bookmark[] {
  const urlMap = new Map<string, Bookmark>()

  for (const b of existing) {
    urlMap.set(b.url.toLowerCase(), b)
  }

  const merged = [...existing]

  for (const b of imported) {
    const existingBm = urlMap.get(b.url.toLowerCase())
    if (existingBm) {
      const mergedTags = Array.from(new Set([...existingBm.tags, ...b.tags])).slice(0, 5)
      existingBm.tags = mergedTags
      existingBm.title = existingBm.title || b.title
    } else {
      merged.push(b)
      urlMap.set(b.url.toLowerCase(), b)
    }
  }

  return merged
}

export function extractAllTags(bookmarks: Bookmark[]): Tag[] {
  const tagSet = new Map<string, Tag>()

  for (const bookmark of bookmarks) {
    for (const tagName of bookmark.tags) {
      if (!tagSet.has(tagName)) {
        tagSet.set(tagName, {
          name: tagName,
          color: hashToColor(tagName)
        })
      }
    }
  }

  return Array.from(tagSet.values()).sort((a, b) => a.name.localeCompare(b.name))
}
