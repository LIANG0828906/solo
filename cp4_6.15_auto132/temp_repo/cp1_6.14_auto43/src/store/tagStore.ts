import { create } from 'zustand'
import type { Tag, TagCreateRequest, TagUpdateRequest } from '@/api/tagApi'
import * as api from '@/api/tagApi'

interface TagStore {
  tags: Tag[]
  searchResults: Tag[]
  activeGroup: string
  loading: boolean
  fetchTags: () => Promise<void>
  addTag: (data: TagCreateRequest) => Promise<Tag>
  updateTag: (id: string, data: TagUpdateRequest) => Promise<void>
  deleteTag: (id: string) => Promise<void>
  searchTags: (q: string) => Promise<void>
  setActiveGroup: (group: string) => void
  clearSearch: () => void
  reorderTags: (groupId: string, startIndex: number, endIndex: number) => void
}

export const useTagStore = create<TagStore>((set, get) => ({
  tags: [],
  searchResults: [],
  activeGroup: 'all',
  loading: false,

  fetchTags: async () => {
    set({ loading: true })
    try {
      const tags = await api.fetchTags()
      set({ tags, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  addTag: async (data) => {
    const newTag = await api.addTag(data)
    set((state) => ({ tags: [newTag, ...state.tags] }))
    return newTag
  },

  updateTag: async (id, data) => {
    const updated = await api.updateTag(id, data)
    set((state) => ({
      tags: state.tags.map((t) => (t.id === id ? updated : t)),
    }))
  },

  deleteTag: async (id) => {
    await api.deleteTag(id)
    set((state) => ({
      tags: state.tags.filter((t) => t.id !== id),
    }))
  },

  searchTags: async (q) => {
    if (!q.trim()) {
      set({ searchResults: [] })
      return
    }
    const results = await api.searchTags(q)
    set({ searchResults: results })
  },

  setActiveGroup: (group) => {
    set({ activeGroup: group })
  },

  clearSearch: () => {
    set({ searchResults: [] })
  },

  reorderTags: (groupId, startIndex, endIndex) => {
    const { tags, activeGroup } = get()
    const filtered = activeGroup === 'all'
      ? tags
      : tags.filter((t) => t.group === activeGroup)

    const dayGroups = groupByDay(filtered)
    const groupTags = dayGroups[groupId]
    if (!groupTags) return

    const [moved] = groupTags.splice(startIndex, 1)
    groupTags.splice(endIndex, 0, moved)

    const reordered = Object.values(dayGroups).flat()
    set({ tags: reordered })

    const updatePromises = reordered.map((t, i) =>
      api.updateTag(t.id, { order: reordered.length - i })
    )
    Promise.all(updatePromises).catch(() => {})
  },
}))

function groupByDay(tags: Tag[]): Record<string, Tag[]> {
  const groups: Record<string, Tag[]> = {}
  for (const tag of tags) {
    const date = new Date(tag.savedAt).toDateString()
    if (!groups[date]) groups[date] = []
    groups[date].push(tag)
  }
  return groups
}
