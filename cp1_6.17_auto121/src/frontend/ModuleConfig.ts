export interface PoemData {
  id: number
  title: string
  author: string
  dynasty: string
  genre: string
  lines: number
  content: string[]
}

export interface PoemListItem {
  id: number
  title: string
  author: string
  dynasty: string
  genre: string
  lines: number
  preview: string
}

export interface FilterState {
  dynasty: string
  author: string
  genre: string
}

export interface FilterOptions {
  dynasties: string[]
  genres: string[]
  authors: string[]
}

export class PoemFilterModule {
  private allPoems: PoemData[] = []
  private filterOptions: FilterOptions = {
    dynasties: [],
    genres: [],
    authors: [],
  }

  constructor(poems: PoemData[] = []) {
    this.setPoems(poems)
  }

  setPoems(poems: PoemData[]): void {
    this.allPoems = poems
    this.updateFilterOptions()
  }

  private updateFilterOptions(): void {
    const dynasties = [...new Set(this.allPoems.map((p) => p.dynasty))].sort()
    const genres = [...new Set(this.allPoems.map((p) => p.genre))].sort()
    const authors = [...new Set(this.allPoems.map((p) => p.author))].sort()

    this.filterOptions = { dynasties, genres, authors }
  }

  getFilterOptions(): FilterOptions {
    return { ...this.filterOptions }
  }

  filterPoems(filters: Partial<FilterState>): PoemListItem[] {
    let filtered = [...this.allPoems]

    if (filters.dynasty) {
      filtered = filtered.filter((p) => p.dynasty === filters.dynasty)
    }

    if (filters.author) {
      filtered = filtered.filter((p) =>
        p.author.toLowerCase().includes(filters.author!.toLowerCase())
      )
    }

    if (filters.genre) {
      filtered = filtered.filter((p) => p.genre === filters.genre)
    }

    return filtered.map((p) => ({
      id: p.id,
      title: p.title,
      author: p.author,
      dynasty: p.dynasty,
      genre: p.genre,
      lines: p.lines,
      preview: p.content.slice(0, 2).join('，') + '...',
    }))
  }

  getLinkedFilters(currentFilters: Partial<FilterState>): FilterOptions {
    let filtered = [...this.allPoems]

    if (currentFilters.dynasty) {
      filtered = filtered.filter((p) => p.dynasty === currentFilters.dynasty)
    }

    if (currentFilters.genre) {
      filtered = filtered.filter((p) => p.genre === currentFilters.genre)
    }

    if (currentFilters.author) {
      filtered = filtered.filter((p) =>
        p.author.toLowerCase().includes(currentFilters.author!.toLowerCase())
      )
    }

    return {
      dynasties: [...new Set(filtered.map((p) => p.dynasty))].sort(),
      genres: [...new Set(filtered.map((p) => p.genre))].sort(),
      authors: [...new Set(filtered.map((p) => p.author))].sort(),
    }
  }

  getPoemById(id: number): PoemData | undefined {
    return this.allPoems.find((p) => p.id === id)
  }
}

export const poemFilterModule = new PoemFilterModule()

export async function fetchPoems(
  filters: Partial<FilterState> = {}
): Promise<PoemListItem[]> {
  const params = new URLSearchParams()
  if (filters.dynasty) params.set('dynasty', filters.dynasty)
  if (filters.author) params.set('author', filters.author)
  if (filters.genre) params.set('genre', filters.genre)

  const response = await fetch(`/api/poems?${params.toString()}`)
  const data = await response.json()

  if (data.success) {
    return data.data
  }
  throw new Error(data.message || '获取诗词列表失败')
}

export async function fetchPoemById(id: number): Promise<PoemData> {
  const response = await fetch(`/api/poems/${id}`)
  const data = await response.json()

  if (data.success) {
    return data.data
  }
  throw new Error(data.message || '获取诗词详情失败')
}

export async function fetchFilterOptions(): Promise<FilterOptions> {
  const response = await fetch('/api/poems/filters')
  const data = await response.json()

  if (data.success) {
    return data.data
  }
  throw new Error(data.message || '获取筛选选项失败')
}
