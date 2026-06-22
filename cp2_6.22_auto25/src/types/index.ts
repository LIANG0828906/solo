export interface ImageItem {
  id: string
  title: string
  url: string
  thumbnailUrl: string
  width: number
  height: number
  tags: string[]
}

export interface TagCount {
  name: string
  count: number
}

export interface GalleryState {
  images: ImageItem[]
  favorites: string[]
  searchQuery: string
  selectedTags: string[]
  searchHistory: string[]
}
