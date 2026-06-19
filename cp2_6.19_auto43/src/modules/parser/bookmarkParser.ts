import { v4 as uuidv4 } from 'uuid'

export interface Bookmark {
  id: string
  title: string
  url: string
  folderPath: string
  addTime: number
  tags: string[]
}

interface ParsedResult {
  success: Bookmark[]
  errors: number
}

function parseDate(dateStr: string | number | undefined): number {
  if (!dateStr) return Date.now()
  if (typeof dateStr === 'number') {
    return dateStr > 9999999999 ? dateStr : dateStr * 1000
  }
  const parsed = Date.parse(dateStr)
  return isNaN(parsed) ? Date.now() : parsed
}

function normalizeUrl(url: string): string {
  if (!url) return ''
  url = url.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }
  return url
}

function normalizeFolderPath(path: string | undefined): string {
  if (!path) return '/'
  path = path.trim()
  if (!path.startsWith('/')) path = '/' + path
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  return path
}

function normalizeTitle(title: string | undefined, url: string): string {
  if (title && title.trim()) return title.trim()
  try {
    const hostname = new URL(url).hostname
    return hostname || 'Untitled'
  } catch {
    return 'Untitled'
  }
}

export function parseBookmarksCSV(content: string): ParsedResult {
  const result: ParsedResult = { success: [], errors: 0 }
  if (!content || !content.trim()) return result

  const lines = content.trim().split(/\r?\n/)
  if (lines.length < 2) return result

  const headerLine = lines[0]
  const delimiter = headerLine.includes('\t') ? '\t' : ','
  const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase())

  const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('name'))
  const urlIdx = headers.findIndex(h => h.includes('url') || h.includes('href') || h.includes('uri'))
  const folderIdx = headers.findIndex(h => h.includes('folder') || h.includes('path') || h.includes('directory'))
  const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('time') || h.includes('added') || h.includes('created'))
  const tagsIdx = headers.findIndex(h => h.includes('tag') || h.includes('label'))

  for (let i = 1; i < lines.length; i++) {
    try {
      const line = lines[i]
      if (!line.trim()) continue

      const values = splitCSVLine(line, delimiter)
      const url = normalizeUrl(values[urlIdx] || '')
      if (!url) {
        result.errors++
        continue
      }

      const title = normalizeTitle(values[titleIdx], url)
      const folderPath = normalizeFolderPath(values[folderIdx])
      const addTime = parseDate(values[dateIdx])
      const tagsStr = values[tagsIdx] || ''
      const tags = tagsStr
        .split(/[,;|]/)
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .slice(0, 5)

      result.success.push({
        id: uuidv4(),
        title,
        url,
        folderPath,
        addTime,
        tags
      })
    } catch {
      result.errors++
    }
  }

  return result
}

function splitCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

interface BookmarkNode {
  type?: string
  name?: string
  title?: string
  url?: string
  uri?: string
  date_added?: string | number
  dateAdded?: string | number
  tags?: string[]
  children?: unknown[]
  roots?: Record<string, unknown>
}

export function parseBookmarksJSON(content: string): ParsedResult {
  const result: ParsedResult = { success: [], errors: 0 }
  if (!content || !content.trim()) return result

  try {
    const data = JSON.parse(content)
    traverseBookmarkTree(data, '/', result)
  } catch {
    result.errors++
  }

  return result
}

function traverseBookmarkTree(node: unknown, folderPath: string, result: ParsedResult): void {
  if (!node || typeof node !== 'object') return

  const n = node as BookmarkNode

  if (isBookmarkNode(n)) {
    const url = normalizeUrl((n.url || n.uri) as string || '')
    if (!url) {
      result.errors++
      return
    }

    const title = normalizeTitle((n.name || n.title) as string | undefined, url)
    const addTime = parseDate(n.date_added || n.dateAdded)
    const tags = Array.isArray(n.tags) ? n.tags.slice(0, 5) : []

    result.success.push({
      id: uuidv4(),
      title,
      url,
      folderPath,
      addTime,
      tags
    })
    return
  }

  const children = getChildren(n)
  if (children && children.length > 0) {
    const folderName = n.name || n.title || ''
    const newFolderPath = folderPath === '/'
      ? '/' + (folderName || 'Bookmarks')
      : folderPath + '/' + (folderName || 'Folder')

    for (const child of children) {
      traverseBookmarkTree(child, newFolderPath, result)
    }
  }
}

function isBookmarkNode(n: BookmarkNode): boolean {
  const type = (n.type as string)?.toLowerCase()
  const hasUrl = !!(n.url || n.uri)
  const hasChildren = !!(n.children && n.children.length > 0)
  return (type === 'url' || (hasUrl && !hasChildren))
}

function getChildren(n: BookmarkNode): unknown[] | null {
  if (n.children && Array.isArray(n.children)) {
    return n.children
  }
  if (n.roots && typeof n.roots === 'object') {
    const roots = n.roots
    const result: unknown[] = []
    for (const key of Object.keys(roots)) {
      if (roots[key]) result.push(roots[key])
    }
    return result
  }
  return null
}
