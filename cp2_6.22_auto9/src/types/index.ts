export interface Image {
  id: string
  title: string
  tags: string[]
  imageUrl: string
  height: number
}

export interface GalleryState {
  images: Image[]
  favorites: Set<string>
  searchQuery: string
  selectedTags: Set<string>
  searchHistory: string[]
}
