import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ImageItem, TagCount } from '@/types'
import { mockImages } from '@/data/mockImages'

const FAVORITES_KEY = 'gallery_favorites'
const HISTORY_KEY = 'gallery_search_history'

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore storage errors
  }
}

export const useGalleryStore = defineStore('gallery', () => {
  const images = ref<ImageItem[]>(mockImages)
  const favorites = ref<string[]>(loadFromStorage(FAVORITES_KEY, []))
  const searchQuery = ref('')
  const selectedTags = ref<string[]>([])
  const searchHistory = ref<string[]>(loadFromStorage(HISTORY_KEY, []))

  const allTags = computed<TagCount[]>(() => {
    const tagMap = new Map<string, number>()
    images.value.forEach((img) => {
      img.tags.forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
      })
    })
    return Array.from(tagMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })

  const filteredImages = computed<ImageItem[]>(() => {
    let result = images.value

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim()
      result = result.filter(
        (img) =>
          img.title.toLowerCase().includes(query) ||
          img.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    if (selectedTags.value.length > 0) {
      result = result.filter((img) =>
        selectedTags.value.every((tag) => img.tags.includes(tag))
      )
    }

    return result
  })

  const favoriteImages = computed<ImageItem[]>(() => {
    return images.value.filter((img) => favorites.value.includes(img.id))
  })

  const favoriteCount = computed(() => favorites.value.length)

  function toggleFavorite(id: string): void {
    const index = favorites.value.indexOf(id)
    if (index === -1) {
      favorites.value.push(id)
    } else {
      favorites.value.splice(index, 1)
    }
    saveToStorage(FAVORITES_KEY, favorites.value)
  }

  function isFavorite(id: string): boolean {
    return favorites.value.includes(id)
  }

  function setSearchQuery(query: string): void {
    searchQuery.value = query
    if (query.trim() && !searchHistory.value.includes(query.trim())) {
      searchHistory.value.unshift(query.trim())
      if (searchHistory.value.length > 5) {
        searchHistory.value.pop()
      }
      saveToStorage(HISTORY_KEY, searchHistory.value)
    }
  }

  function clearSearchQuery(): void {
    searchQuery.value = ''
  }

  function toggleTag(tag: string): void {
    const index = selectedTags.value.indexOf(tag)
    if (index === -1) {
      selectedTags.value.push(tag)
    } else {
      selectedTags.value.splice(index, 1)
    }
  }

  function isTagSelected(tag: string): boolean {
    return selectedTags.value.includes(tag)
  }

  function clearAllTags(): void {
    selectedTags.value = []
  }

  function clearSearchHistory(): void {
    searchHistory.value = []
    saveToStorage(HISTORY_KEY, [])
  }

  function useHistoryItem(term: string): void {
    searchQuery.value = term
  }

  return {
    images,
    favorites,
    searchQuery,
    selectedTags,
    searchHistory,
    allTags,
    filteredImages,
    favoriteImages,
    favoriteCount,
    toggleFavorite,
    isFavorite,
    setSearchQuery,
    clearSearchQuery,
    toggleTag,
    isTagSelected,
    clearAllTags,
    clearSearchHistory,
    useHistoryItem,
  }
})
