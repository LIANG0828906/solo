import type { Bookmark } from '../parser/bookmarkParser'

interface IndexEntry {
  bookmarkId: string
  positions: number[]
}

interface ScoredResult {
  id: string
  score: number
}

class SearchEngine {
  private invertedIndex: Map<string, IndexEntry[]> = new Map()
  private bookmarks: Map<string, Bookmark> = new Map()
  private titleWeights: Map<string, number> = new Map()
  private lastQuery = ''
  private lastResults: string[] = []

  buildIndex(bookmarks: Bookmark[]): void {
    this.invertedIndex.clear()
    this.bookmarks.clear()
    this.titleWeights.clear()
    this.lastQuery = ''
    this.lastResults = []

    for (const bookmark of bookmarks) {
      this.bookmarks.set(bookmark.id, bookmark)

      const titleTokens = this.tokenize(bookmark.title)
      const urlTokens = this.tokenize(this.extractUrlParts(bookmark.url))
      const tagTokens = bookmark.tags.flatMap(tag => this.tokenize(tag))

      const allTokens = [
        ...titleTokens.map(t => ({ token: t, weight: 3 })),
        ...urlTokens.map(t => ({ token: t, weight: 1 })),
        ...tagTokens.map(t => ({ token: t, weight: 2 }))
      ]

      for (let i = 0; i < allTokens.length; i++) {
        const { token, weight } = allTokens[i]
        if (!token) continue

        const existing = this.invertedIndex.get(token) || []
        const entry = existing.find(e => e.bookmarkId === bookmark.id)

        if (entry) {
          entry.positions.push(i)
        } else {
          existing.push({ bookmarkId: bookmark.id, positions: [i] })
          this.invertedIndex.set(token, existing)
        }

        const currentWeight = this.titleWeights.get(bookmark.id) || 0
        this.titleWeights.set(bookmark.id, currentWeight + weight)
      }
    }
  }

  search(query: string): string[] {
    if (!query || !query.trim()) {
      return Array.from(this.bookmarks.keys())
    }

    const normalizedQuery = query.trim().toLowerCase()

    if (normalizedQuery === this.lastQuery) {
      return this.lastResults
    }

    const queryTokens = this.tokenize(normalizedQuery)
    if (queryTokens.length === 0) {
      return Array.from(this.bookmarks.keys())
    }

    const scoredResults = new Map<string, ScoredResult>()

    for (const token of queryTokens) {
      const matches = this.findPrefixMatches(token)
      for (const match of matches) {
        const entries = this.invertedIndex.get(match) || []
        for (const entry of entries) {
          const existing = scoredResults.get(entry.bookmarkId)
          const baseScore = entry.positions.length
          const prefixBonus = match === token ? 2 : 1
          const weightBonus = this.titleWeights.get(entry.bookmarkId) || 0
          const totalScore = baseScore * prefixBonus + weightBonus * 0.5

          if (existing) {
            existing.score += totalScore
          } else {
            scoredResults.set(entry.bookmarkId, {
              id: entry.bookmarkId,
              score: totalScore
            })
          }
        }
      }
    }

    const results = Array.from(scoredResults.values())
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        const bm1 = this.bookmarks.get(a.id)
        const bm2 = this.bookmarks.get(b.id)
        return (bm2?.addTime || 0) - (bm1?.addTime || 0)
      })
      .map(r => r.id)

    this.lastQuery = normalizedQuery
    this.lastResults = results

    return results
  }

  getSuggestions(query: string, limit = 5): Bookmark[] {
    if (!query || !query.trim()) return []

    const results = this.search(query)
    return results
      .slice(0, limit)
      .map(id => this.bookmarks.get(id))
      .filter((b): b is Bookmark => b !== undefined)
  }

  private tokenize(text: string): string[] {
    if (!text) return []

    return text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, ' ')
      .split(/[\s_-]+/)
      .filter(token => token.length > 0)
  }

  private extractUrlParts(url: string): string {
    try {
      const u = new URL(url)
      const hostname = u.hostname.replace(/^www\./, '')
      const pathname = u.pathname.replace(/\//g, ' ')
      return `${hostname} ${pathname}`
    } catch {
      return url
    }
  }

  private findPrefixMatches(prefix: string): string[] {
    const matches: string[] = []
    const prefixLower = prefix.toLowerCase()

    for (const term of this.invertedIndex.keys()) {
      if (term.startsWith(prefixLower)) {
        matches.push(term)
      }
    }

    return matches
  }
}

export const searchEngine = new SearchEngine()

export function highlightText(text: string, query: string): string {
  if (!query || !query.trim()) return text

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')

  return text.replace(regex, '<mark class="highlight">$1</mark>')
}
