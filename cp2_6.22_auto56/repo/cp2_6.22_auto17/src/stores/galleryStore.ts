import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ImageItem, TagInfo } from '@/types'
import { mockImages } from '@/data/mockImages'

export const useGalleryStore = defineStore('gallery', () => {
  const images = ref<ImageItem[]>(mockImages)
  const favorites = ref<string[]>([])
  const searchQuery = ref('')
  const searchHistory = ref<string[]>([])
  const selectedTags = ref<string[]>([])
  const selectedImage = ref<ImageItem | null>(null)
  const filterScope = ref<'all' | 'favorites'>('all')

  const allTags = computed<TagInfo[]>(() => {
    const map = new Map<string, number>()
    images.value.forEach((img) => {
      img.tags.forEach((t) => map.set(t, (map.get(t) ?? 0) + 1))
    })
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })

  const favoriteImages = computed(() =>
    images.value.filter((img) => favorites.value.includes(img.id)),
  )

  const favoritesCount = computed(() => favorites.value.length)

  const filteredImages = computed(() => {
    const base =
      filterScope.value === 'favorites' ? favoriteImages.value : images.value
    const q = searchQuery.value.trim().toLowerCase()
    return base.filter((img) => {
      if (selectedTags.value.length > 0) {
        const hasAll = selectedTags.value.every((t) => img.tags.includes(t))
        if (!hasAll) return false
      }
      if (!q) return true
      if (img.title.toLowerCase().includes(q)) return true
      return img.tags.some((t) => t.toLowerCase().includes(q))
    })
  })

  function toggleFavorite(id: string) {
    const idx = favorites.value.indexOf(id)
    if (idx >= 0) {
      favorites.value.splice(idx, 1)
    } else {
      favorites.value.push(id)
    }
  }

  function isFavorite(id: string) {
    return favorites.value.includes(id)
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
    const trimmed = query.trim()
    if (trimmed) {
      const hist = searchHistory.value.filter((h) => h !== trimmed)
      hist.unshift(trimmed)
      searchHistory.value = hist.slice(0, 5)
    }
  }

  function clearSearch() {
    searchQuery.value = ''
  }

  function toggleTag(tag: string) {
    const idx = selectedTags.value.indexOf(tag)
    if (idx >= 0) {
      selectedTags.value.splice(idx, 1)
    } else {
      selectedTags.value.push(tag)
    }
  }

  function clearTags() {
    selectedTags.value = []
  }

  function openModal(image: ImageItem) {
    selectedImage.value = image
  }

  function closeModal() {
    selectedImage.value = null
  }

  function setScope(scope: 'all' | 'favorites') {
    filterScope.value = scope
  }

  return {
    images,
    favorites,
    searchQuery,
    searchHistory,
    selectedTags,
    selectedImage,
    filterScope,
    allTags,
    favoriteImages,
    favoritesCount,
    filteredImages,
    toggleFavorite,
    isFavorite,
    setSearchQuery,
    clearSearch,
    toggleTag,
    clearTags,
    openModal,
    closeModal,
    setScope,
  }
})
