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
  const favorites = ref<string[]>(loadFromStorage<string[]>(FAVORITES_KEY, []))
  const searchQuery = ref<string>('')
  const selectedTags = ref<string[]>([])
  const searchHistory = ref<string[]>(loadFromStorage<string[]>(HISTORY_KEY, []))

  const filteredImages = computed<ImageItem[]>(() => {
    let result: ImageItem[] = images.value

    if (searchQuery.value.trim()) {
      const query: string = searchQuery.value.toLowerCase().trim()
      result = result.filter(
        (img: ImageItem): boolean =>
          img.title.toLowerCase().includes(query) ||
          img.tags.some((tag: string): boolean => tag.toLowerCase().includes(query))
      )
    }

    if (selectedTags.value.length > 0) {
      result = result.filter((img: ImageItem): boolean =>
        selectedTags.value.every((tag: string): boolean => img.tags.includes(tag))
      )
    }

    return result
  })

  const allTags = computed<TagCount[]>(() => {
    const tagMap = new Map<string, number>()
    filteredImages.value.forEach((img: ImageItem): void => {
      img.tags.forEach((tag: string): void => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
      })
    })
    return Array.from(tagMap.entries())
      .map(([name, count]: [string, number]) => ({ name, count }))
      .sort((a: TagCount, b: TagCount): number => a.name.localeCompare(b.name))
  })

  const favoriteImages = computed<ImageItem[]>(() => {
    return images.value.filter((img: ImageItem): boolean => favorites.value.includes(img.id))
  })

  const filteredFavoriteImages = computed<ImageItem[]>(() => {
    let result: ImageItem[] = favoriteImages.value

    if (searchQuery.value.trim()) {
      const query: string = searchQuery.value.toLowerCase().trim()
      result = result.filter(
        (img: ImageItem): boolean =>
          img.title.toLowerCase().includes(query) ||
          img.tags.some((tag: string): boolean => tag.toLowerCase().includes(query))
      )
    }

    if (selectedTags.value.length > 0) {
      result = result.filter((img: ImageItem): boolean =>
        selectedTags.value.every((tag: string): boolean => img.tags.includes(tag))
      )
    }

    return result
  })

  const favoriteTags = computed<TagCount[]>(() => {
    const tagMap = new Map<string, number>()
    filteredFavoriteImages.value.forEach((img: ImageItem): void => {
      img.tags.forEach((tag: string): void => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
      })
    })
    return Array.from(tagMap.entries())
      .map(([name, count]: [string, number]) => ({ name, count }))
      .sort((a: TagCount, b: TagCount): number => a.name.localeCompare(b.name))
  })

  const favoriteCount = computed<number>(() => favorites.value.length)

  function toggleFavorite(id: string): void {
    const index: number = favorites.value.indexOf(id)
    if (index === -1) {
      favorites.value.push(id)
    } else {
      favorites.value.splice(index, 1)
    }
    saveToStorage<string[]>(FAVORITES_KEY, favorites.value)
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
      saveToStorage<string[]>(HISTORY_KEY, searchHistory.value)
    }
  }

  function clearSearchQuery(): void {
    searchQuery.value = ''
  }

  function toggleTag(tag: string): void {
    const index: number = selectedTags.value.indexOf(tag)
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
    saveToStorage<string[]>(HISTORY_KEY, [])
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
    filteredFavoriteImages,
    favoriteTags,
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
