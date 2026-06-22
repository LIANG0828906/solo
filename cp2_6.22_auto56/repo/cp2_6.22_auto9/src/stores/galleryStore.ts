import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Image } from '../types'

const mockImages: Image[] = [
  {
    id: '1',
    title: '山间日出',
    tags: ['自然', '风景', '山脉'],
    imageUrl: 'https://picsum.photos/seed/mountain1/600/400',
    height: 400
  },
  {
    id: '2',
    title: '城市夜景',
    tags: ['城市', '夜景', '建筑'],
    imageUrl: 'https://picsum.photos/seed/city1/600/800',
    height: 800
  },
  {
    id: '3',
    title: '海边沙滩',
    tags: ['自然', '海洋', '沙滩'],
    imageUrl: 'https://picsum.photos/seed/beach1/600/500',
    height: 500
  },
  {
    id: '4',
    title: '森林小径',
    tags: ['自然', '森林', '树木'],
    imageUrl: 'https://picsum.photos/seed/forest1/600/700',
    height: 700
  },
  {
    id: '5',
    title: '古城建筑',
    tags: ['建筑', '历史', '文化'],
    imageUrl: 'https://picsum.photos/seed/oldtown1/600/600',
    height: 600
  },
  {
    id: '6',
    title: '花卉特写',
    tags: ['自然', '花卉', '植物'],
    imageUrl: 'https://picsum.photos/seed/flower1/600/450',
    height: 450
  },
  {
    id: '7',
    title: '雪山风光',
    tags: ['自然', '山脉', '雪景'],
    imageUrl: 'https://picsum.photos/seed/snow1/600/900',
    height: 900
  },
  {
    id: '8',
    title: '现代建筑',
    tags: ['建筑', '城市', '设计'],
    imageUrl: 'https://picsum.photos/seed/arch1/600/550',
    height: 550
  },
  {
    id: '9',
    title: '瀑布景观',
    tags: ['自然', '水景', '森林'],
    imageUrl: 'https://picsum.photos/seed/waterfall1/600/750',
    height: 750
  },
  {
    id: '10',
    title: '街头艺术',
    tags: ['城市', '艺术', '文化'],
    imageUrl: 'https://picsum.photos/seed/streetart1/600/650',
    height: 650
  },
  {
    id: '11',
    title: '沙漠日落',
    tags: ['自然', '沙漠', '风景'],
    imageUrl: 'https://picsum.photos/seed/desert1/600/480',
    height: 480
  },
  {
    id: '12',
    title: '咖啡馆内饰',
    tags: ['室内', '设计', '生活'],
    imageUrl: 'https://picsum.photos/seed/cafe1/600/720',
    height: 720
  },
  {
    id: '13',
    title: '猫咪肖像',
    tags: ['动物', '宠物', '猫咪'],
    imageUrl: 'https://picsum.photos/seed/cat1/600/600',
    height: 600
  },
  {
    id: '14',
    title: '狗狗玩耍',
    tags: ['动物', '宠物', '狗狗'],
    imageUrl: 'https://picsum.photos/seed/dog1/600/520',
    height: 520
  },
  {
    id: '15',
    title: '星空银河',
    tags: ['自然', '夜空', '星空'],
    imageUrl: 'https://picsum.photos/seed/star1/600/850',
    height: 850
  },
  {
    id: '16',
    title: '古镇水乡',
    tags: ['建筑', '历史', '水景'],
    imageUrl: 'https://picsum.photos/seed/watertown1/600/680',
    height: 680
  },
  {
    id: '17',
    title: '美食拼盘',
    tags: ['美食', '生活', '料理'],
    imageUrl: 'https://picsum.photos/seed/food1/600/580',
    height: 580
  },
  {
    id: '18',
    title: '草原风光',
    tags: ['自然', '风景', '草原'],
    imageUrl: 'https://picsum.photos/seed/grassland1/600/420',
    height: 420
  },
  {
    id: '19',
    title: '图书馆角落',
    tags: ['室内', '文化', '阅读'],
    imageUrl: 'https://picsum.photos/seed/library1/600/780',
    height: 780
  },
  {
    id: '20',
    title: '热气球升空',
    tags: ['运动', '风景', '冒险'],
    imageUrl: 'https://picsum.photos/seed/balloon1/600/640',
    height: 640
  },
  {
    id: '21',
    title: '秋叶纷飞',
    tags: ['自然', '秋天', '树木'],
    imageUrl: 'https://picsum.photos/seed/autumn1/600/560',
    height: 560
  },
  {
    id: '22',
    title: '樱花盛开',
    tags: ['自然', '春天', '花卉'],
    imageUrl: 'https://picsum.photos/seed/sakura1/600/660',
    height: 660
  }
]

export const useGalleryStore = defineStore('gallery', () => {
  const images = ref<Image[]>(mockImages)
  const favorites = ref<Set<string>>(new Set())
  const searchQuery = ref<string>('')
  const selectedTags = ref<Set<string>>(new Set())
  const searchHistory = ref<string[]>([])
  const selectedImage = ref<Image | null>(null)
  const showModal = ref(false)

  const filteredImages = computed<Image[]>(() => {
    let result = images.value

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(img =>
        img.title.toLowerCase().includes(query) ||
        img.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    if (selectedTags.value.size > 0) {
      result = result.filter(img =>
        Array.from(selectedTags.value).every(tag => img.tags.includes(tag))
      )
    }

    return result
  })

  const allTags = computed<{ tag: string; count: number }[]>(() => {
    const tagCount = new Map<string, number>()
    images.value.forEach(img => {
      img.tags.forEach(tag => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1)
      })
    })
    const collator = new Intl.Collator('zh-CN', {
      sensitivity: 'accent',
      usage: 'sort'
    })
    return Array.from(tagCount.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => collator.compare(a.tag, b.tag))
  })

  const favoriteImages = computed<Image[]>(() => {
    return images.value.filter(img => favorites.value.has(img.id))
  })

  function toggleFavorite(imageId: string) {
    if (favorites.value.has(imageId)) {
      favorites.value.delete(imageId)
    } else {
      favorites.value.add(imageId)
    }
  }

  function toggleTag(tag: string) {
    if (selectedTags.value.has(tag)) {
      selectedTags.value.delete(tag)
    } else {
      selectedTags.value.add(tag)
    }
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  function addToSearchHistory(query: string) {
    if (!query.trim()) return
    const trimmed = query.trim()
    const history = searchHistory.value.filter(item => item !== trimmed)
    history.unshift(trimmed)
    if (history.length > 5) {
      history.pop()
    }
    searchHistory.value = history
  }

  function clearSearch() {
    searchQuery.value = ''
    selectedTags.value.clear()
  }

  function openModal(image: Image) {
    selectedImage.value = image
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
  }

  function toggleFavoriteFromModal() {
    if (selectedImage.value) {
      toggleFavorite(selectedImage.value.id)
    }
  }

  return {
    images,
    favorites,
    searchQuery,
    selectedTags,
    searchHistory,
    selectedImage,
    showModal,
    filteredImages,
    allTags,
    favoriteImages,
    toggleFavorite,
    toggleTag,
    setSearchQuery,
    addToSearchHistory,
    clearSearch,
    openModal,
    closeModal,
    toggleFavoriteFromModal
  }
})
