import { create } from 'zustand'
import type { Bookmark } from './modules/parser/bookmarkParser'
import type { Tag } from './modules/storage/storageService'

interface FilterState {
  folderPath: string | null
  tagName: string | null
}

interface AppState {
  bookmarks: Bookmark[]
  tags: Tag[]
  filter: FilterState
  searchQuery: string
  viewMode: 'grid' | 'list'
  sidebarOpen: boolean
  setBookmarks: (bookmarks: Bookmark[]) => void
  setTags: (tags: Tag[]) => void
  setFilter: (filter: Partial<FilterState>) => void
  setSearch: (query: string) => void
  toggleView: () => void
  setViewMode: (mode: 'grid' | 'list') => void
  addBookmarks: (bookmarks: Bookmark[]) => void
  updateBookmark: (id: string, updates: Partial<Bookmark>) => void
  addTagToBookmark: (bookmarkId: string, tagName: string) => void
  removeTagFromBookmark: (bookmarkId: string, tagName: string) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  bookmarks: [],
  tags: [],
  filter: { folderPath: null, tagName: null },
  searchQuery: '',
  viewMode: 'grid',
  sidebarOpen: false,

  setBookmarks: (bookmarks) => set({ bookmarks }),

  setTags: (tags) => set({ tags }),

  setFilter: (filter) => set((state) => ({
    filter: { ...state.filter, ...filter }
  })),

  setSearch: (searchQuery) => set({ searchQuery }),

  toggleView: () => set((state) => ({
    viewMode: state.viewMode === 'grid' ? 'list' : 'grid'
  })),

  setViewMode: (mode) => set({ viewMode: mode }),

  addBookmarks: (newBookmarks) => set((state) => {
    const existingUrls = new Set(state.bookmarks.map(b => b.url.toLowerCase()))
    const toAdd = newBookmarks.filter(b => !existingUrls.has(b.url.toLowerCase()))
    return { bookmarks: [...state.bookmarks, ...toAdd] }
  }),

  updateBookmark: (id, updates) => set((state) => ({
    bookmarks: state.bookmarks.map(b =>
      b.id === id ? { ...b, ...updates } : b
    )
  })),

  addTagToBookmark: (bookmarkId, tagName) => set((state) => {
    const bookmarks = state.bookmarks.map(b => {
      if (b.id !== bookmarkId) return b
      if (b.tags.includes(tagName)) return b
      const newTags = b.tags.length < 5 ? [...b.tags, tagName] : b.tags
      return { ...b, tags: newTags }
    })

    const tags = [...state.tags]
    if (!tags.find(t => t.name === tagName)) {
      let hash = 0
      for (let i = 0; i < tagName.length; i++) {
        hash = tagName.charCodeAt(i) + ((hash << 5) - hash)
      }
      const hue = Math.abs(hash % 360)
      tags.push({ name: tagName, color: `hsl(${hue}, 70%, 55%)` })
      tags.sort((a, b) => a.name.localeCompare(b.name))
    }

    return { bookmarks, tags }
  }),

  removeTagFromBookmark: (bookmarkId, tagName) => set((state) => ({
    bookmarks: state.bookmarks.map(b =>
      b.id === bookmarkId
        ? { ...b, tags: b.tags.filter(t => t !== tagName) }
        : b
    )
  })),

  toggleSidebar: () => set((state) => ({
    sidebarOpen: !state.sidebarOpen
  })),

  setSidebarOpen: (open) => set({ sidebarOpen: open })
}))

export function useFilteredBookmarks(): Bookmark[] {
  const { bookmarks, filter, searchQuery } = useStore.getState()
  let filtered = [...bookmarks]

  if (filter.folderPath) {
    const prefix = filter.folderPath === '/'
      ? '/'
      : filter.folderPath + '/'
    filtered = filtered.filter(b =>
      b.folderPath === filter.folderPath || b.folderPath.startsWith(prefix)
    )
  }

  if (filter.tagName) {
    filtered = filtered.filter(b => b.tags.includes(filter.tagName as string))
  }

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(b =>
      b.title.toLowerCase().includes(query) ||
      b.url.toLowerCase().includes(query)
    )
  }

  return filtered.sort((a, b) => b.addTime - a.addTime)
}
